import math
from datetime import datetime

from flask import Flask
from flask_restful import Resource, Api, reqparse
from flask_cors import CORS
from section_nodes import Node

from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search
from elasticsearch_dsl.query import Q
from elasticsearch_dsl.aggs import A

es = Elasticsearch(hosts = [{'host': 'elasticsearch', 'port': 9200}])

languages = {'apa': 'german', 'reuters': 'english'}
delimiters = {'apa': '/', 'reuters': '-'}

app = Flask(__name__, static_url_path='')

CORS(app, resources={'/api/*': {'origins': '*'}})
api = Api(app, prefix='/api')


class Article(Resource):
    def get(self, article_id):
        parser = reqparse.RequestParser()
        parser.add_argument('corpus', type=str, required=True)
        args = parser.parse_args()
        corpus = args['corpus']

        article = es.get(index=corpus, id=article_id, doc_type='articles')
        return {'article': article['_source']}

    def put(self, article_id):
        parser = reqparse.RequestParser()
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('exclude', type=str, required=True)
        parser.add_argument('mediatopic', type=str, required=True)
        parser.add_argument('association', type=str, required=False)

        args = parser.parse_args()
        corpus = args['corpus']
        exclude = args['exclude']
        media_topic_id = args['mediatopic']
        association = args['association']

        if media_topic_id is None or media_topic_id == '':
            return {'exclude': 'false', 'msg': 'media topic is unset for ' + article_id}

        if exclude != 'true' and exclude != 'false':
            return {'exclude': 'false', 'msg': 'article ' + article_id + ' failed to be flagged for ' + media_topic_id}

        article = es.get(index=corpus, id=article_id, doc_type='articles')
        if article is None:
            return {'exclude': 'false', 'msg': 'article ' + article_id + ' does not exist. Failed to be flagged.'}

        # update topics set
        media_topics = article['_source']['mediatopics']
        for media_topic in media_topics:
            if media_topic['id'] == media_topic_id:
                media_topic['exclude'] = exclude

        # update topics subset
        sbt = 'direct_media_topics' if (association is None or association == 'why:direct') else 'ancestor_media_topics'
        media_topics_subset = article['_source'][sbt]
        for media_topic in media_topics_subset:
            if media_topic['id'] == media_topic_id:
                media_topic['exclude'] = exclude

        body = {'doc' : {'mediatopics' : media_topics, sbt : media_topics_subset}}

        es.update(index=corpus, doc_type='articles', id=article_id, body=body)
        return {'msg': 'article ' + article_id + ' is flagged as exclude:' + exclude + ' for ' + media_topic_id}


class ArticleXML(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('articleId', type=str, required=True)

        args = parser.parse_args()
        corpus = args['corpus']
        article_id = args['articleId']

        article = es.get(index=corpus, id=article_id, doc_type='articles')
        if article is None:
            return {'xml' : ''}

        filename = article['_source']['filename']
        if corpus == 'reuters':
            filename += '.nml2.xml'

        response = {}
        with open('./xml/' + corpus + '/' + filename, 'r') as f:
            xml_content = f.read()
            response['xml'] = xml_content

        return response


class Articles(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('q', type=str, required=False)
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('split', type=str, required=False)
        parser.add_argument('excluded', type=str, required=False)
        parser.add_argument('page', type=int, required=False)
        parser.add_argument('nPerPage', type=int, required=False)
        parser.add_argument('since', type=int, required=False)
        parser.add_argument('until', type=int, required=False)
        parser.add_argument('mediatopic', type=str, required=False)
        parser.add_argument('association', type=str, required=False)
        parser.add_argument('section', type=str, required=False)

        args = parser.parse_args()
        search = Search(using=es)
        corpus = args['corpus']

        lang = languages[corpus]
        delimiter = delimiters[corpus]

        search = search.index(corpus)
        search = search.doc_type('articles')

        page = args['page'] if args['page'] is not None else 1
        n_per_page = args['nPerPage'] if args['nPerPage'] is not None else 10
        search = search.sort('-contentCreated')
        search = search[(page-1)*n_per_page : page * n_per_page]
        search = search.source(exclude=['direct_media_topics', 'ancestor_media_topics'])

        if args['q'] is not None and args['q'] is not '':
            search = search.query('bool', must=Q('query_string', query=args['q'], fields=['title^3', 'body^2', 'slugline'],
                analyzer=lang, analyze_wildcard='true', default_operator='or'))
            search = search.highlight_options(number_of_fragments=0, pre_tags=['<span class="highlight">'], post_tags=['</span>'])
            search = search.highlight('title', 'body', fragment_size=0)
            search = search.sort('_score', '-contentCreated')

        filters = []
        if args['since'] is not None and args['since'] is not 0:
            since = datetime.fromtimestamp(args['since']).isoformat()
            filters.append(Q('range', contentCreated={'gte':since}))

        if args['until'] is not None and args['until'] is not 0:
            until = datetime.fromtimestamp(args['until']).isoformat()
            filters.append(Q('range', contentCreated={'lt':until}))

        media_topic_id = args['mediatopic']
        if (media_topic_id is not None and media_topic_id is not '') and args['association'] is not None:
            must_query = [
                {'term': {'mediatopics.id': media_topic_id}},
                {'term': {'mediatopics.association': args['association']}}
            ]
            if not (args['split'] is None or args['split'] == 'all' or args['split'] == ''):
                must_query.append({'term': {'mediatopics.split': args['split']}})

            if args['excluded'] == 'true':
                must_query.append({'term': {'mediatopics.exclude': args['excluded']}})

            media_topic_query = {
                'nested': {
                    'path': 'mediatopics',
                    'query': {
                        'bool': {
                            'must': must_query
                        }
                    }
                }
            }
            filters.append(media_topic_query)

        if args['section'] is not None and args['section'] != '':
            filters.append(Q('match', slugline=args['section']))

        if filters:
            search = search.query('bool', filter=filters)

        response = search.execute()

        articles = []
        for hit in response:
            article = hit.to_dict()
            if 'highlight' in hit.meta:
                if 'title' in hit.meta.highlight:
                    for title_fragment in hit.meta.highlight.title:
                        article['title'] = title_fragment
                        break
                if 'body' in hit.meta.highlight:
                    for body_fragment in hit.meta.highlight.body:
                        article['body'] = body_fragment
                        break
            if (media_topic_id is not None and media_topic_id is not '') and args['association'] is not None:
                for media_topic in article['mediatopics']:
                    if media_topic['id'] == media_topic_id and 'exclude' in media_topic and media_topic['exclude'] == 'true':
                        article['exclude'] = 'true'
                        break
            articles.append(article)

        return {
            'found': search.count(),
            'page': page,
            'nPerPage': n_per_page,
            'lastPage': math.ceil(search.count() / n_per_page) if n_per_page is not 0 else 1,
            'articles': articles,
            'from': (page - 1) * n_per_page,
            'to': page * n_per_page,
            'delimiter':delimiter
        }


class Topics(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('split', type=str, required=False)
        parser.add_argument('association', type=str, required=False)

        args = parser.parse_args()
        corpus = args['corpus']

        field = 'direct_media_topics'
        if args['association'] is not None and args['association'] == 'why:ancestor':
            field = 'ancestor_media_topics'

        search = Search(using=es)
        search = search.index(corpus)
        search = search.doc_type('articles')

        search = search[0:0]
        aggregations = {
            'nested': {
                'path': field
            },
            'aggs': {
                field+'.id': A('terms', field=field+'.id', size=1000, min_doc_count=1)
            }
        }
        search.aggs.bucket(field, aggregations)
        response = search.execute()

        aggregations = response.aggregations
        buckets = aggregations[field][field+'.id']['buckets']

        response = []
        for bin in buckets:
            id = bin['key']
            result = es.get(index=corpus, id=id, doc_type='media_topics')
            media_topic = result['_source']
            media_topic['doc_count'] = bin['doc_count']
            response.append(media_topic)
        return response


class Statistics(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('field', type=str, required=True)
        parser.add_argument('corpus', type=str, required=True)

        args = parser.parse_args()
        field = args['field']
        corpus = args['corpus']

        search = Search(using=es)
        search = search.index(corpus)
        search = search.doc_type('articles')

        search = search[0:0]
        search.aggs.metric(field, 'stats', field=field)

        response = search.execute()
        return response.aggregations[field].to_dict()


class Top(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('field', type=str, required=True)
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('size', type=str, required=False)

        args = parser.parse_args()
        field = args['field']
        corpus = args['corpus']

        size = args['size'] if args['size'] is not None else 500

        search = Search(using=es)
        search = search.index(corpus)
        search = search.doc_type('articles')

        search = search[0:0]

        if '.' not in field:
            aggregations = A('terms', field=field, size=size)
            search.aggs.bucket(field, aggregations)
        else:
            parts = field.split('.')
            aggregations = {
                'nested': {
                    'path': parts[0]
                },
                'aggs': {
                    field: A('terms', field=field, size=size)
                }
            }
            search.aggs.bucket(parts[0], aggregations)

        response = search.execute()

        aggregations = response.aggregations
        if '.' not in field:
            buckets = aggregations[field]['buckets']
        else:
            parts = field.split('.')
            buckets = aggregations[parts[0]][field]['buckets']

        response = []
        for bin in buckets:
            response.append(
               bin.to_dict()
            )
        return response


class TopTerms(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('q', type=str, required=True)
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('size', type=str, required=False)

        args = parser.parse_args()
        query = args['q']
        corpus = args['corpus']

        size = args['size'] if args['size'] is not None else 20

        search = Search(using=es)
        search = search.index(corpus)
        search = search.doc_type('articles')

        search = search[0:10]

        search = search.query('match', text=query)

        aggregations = A('terms', field='text', size=size)
        search.aggs.bucket('text', aggregations)

        response = search.execute()
        return response.to_dict()
        aggregations = response.aggregations

        return aggregations.to_dict()


class Section(Resource):
    def get(self, section_id=None):
        parser = reqparse.RequestParser()
        parser.add_argument('corpus', type=str, required=True)
        args = parser.parse_args()

        corpus = args['corpus']
        if section_id == 'root' or section_id is None:
            search = Search(using=es)
            search = search.index(corpus)
            search = search.doc_type('sections')
            search = search.query(Q('term', level=0))
            response = search.execute()
            for hit in response.hits:
                section = hit.to_dict()
                return {'section': section}
        else:
            section = es.get(index='sections', id=section_id, doc_type=corpus)
            section = section['_source']

            return {'section': section, 'delimiter' : delimiters[corpus]}


class SectionChildren(Resource):
    def get(self, section_id):
        parser = reqparse.RequestParser()
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('page', type=int, required=False)
        parser.add_argument('nPerPage', type=int, required=False)

        args = parser.parse_args()
        corpus = args['corpus']

        current = None
        search = Search(using=es)
        search = search.index(corpus)
        search = search.doc_type('sections')
        if section_id == 'root':
            search = search.query(Q('term', level=0))
        else:
            search = search.query(Q('term', id=section_id))

        response = search.execute()
        for hit in response.hits:
            section_id = hit.id
            current =  hit.to_dict()
            break

        page = args['page'] if args['page'] is not None else 1
        n_per_page = args['nPerPage'] if args['nPerPage'] is not None else 20

        search = Search(using=es)
        search = search.index(corpus)
        search = search.doc_type('sections')
        search = search[(page-1)*n_per_page : page * n_per_page]
        search = search.query(Q('term', parent=section_id))
        search = search.sort('label')

        response = search.execute()

        sections = []
        for hit in response.hits:
            section = hit.to_dict()
            sections.append(section)

        return {
            'found': response.hits.total,
            'current': current,
            'sections' : sections,
            'delimiter' : delimiters[corpus]
        }


class Sections(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('corpus', type=str, required=True)
        parser.add_argument('page', type=int, required=False)
        parser.add_argument('nPerPage', type=int, required=False)
        parser.add_argument('q', type=str, required=True)

        args = parser.parse_args()

        corpus = args['corpus']
        page = args['page'] if args['page'] is not None else 1
        n_per_page = args['nPerPage'] if args['nPerPage'] is not None else 20

        search = Search(using=es)
        search = search.index(corpus)
        search = search.doc_type('sections')
        search = search.sort('level')
        search = search[(page - 1) * n_per_page: page * n_per_page]

        query = args['q']
        if query is not None and query != '':
            search = search.query(Q('simple_query_string',query=args['q'], fields=['name'], analyzer='path-analyzer', default_operator='AND'))

        response = search.execute()

        sections = []
        for hit in response.hits:
            section = hit.to_dict()
            sections.append(section)

        trees = []
        for section in sections:
            parent_node = None
            for tree in trees:
                parent_node = tree.get_by_id(section['parent'])
                if parent_node is not None:
                    break

            if parent_node is None:
                node = Node(section['name'], parent_id=section['parent'], level=section['level'])
                node.id = section['id']
                trees.append(node)
            else:
                node = Node(section['name'])
                node.id = section['id']
                parent_node.add_child(node)

        json_trees = []
        for tree in trees:
            json_trees.append(tree.to_json())

        return {'sections': json_trees, 'delimiter' : delimiters[corpus]}


@app.errorhandler(404)
def page_not_found(error):
    return 'page not found'


@app.errorhandler(500)
def raise_error(error):
    return error


if __name__ == '__main__':
    api.add_resource(Articles, '/articles')
    api.add_resource(Article, '/articles/<article_id>')
    api.add_resource(ArticleXML, '/article/xml')
    api.add_resource(Topics, '/topics')
    api.add_resource(Statistics, '/stats')
    api.add_resource(Top, '/top')
    api.add_resource(Section, '/section/<section_id>', '/section')
    api.add_resource(SectionChildren, '/section/<section_id>/children')
    api.add_resource(Sections, '/sections')
    api.add_resource(TopTerms, '/terms')

    app.run(host='0.0.0.0', port=5000, threaded=True)
