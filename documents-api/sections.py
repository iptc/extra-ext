import uuid
import os
import json
from elasticsearch import Elasticsearch

class Node(object):
    tab = '\t'

    def __init__(self, data, delimiter, parent_id=None, level=0):
        self.id = str(uuid.uuid3(uuid.NAMESPACE_DNS, data))
        self.data = data
        self.delimiter = delimiter
        self.parent_id = parent_id
        self.level = level

        parts = data.split(delimiter)
        self.label = parts[-1]

        self.children = []

    def walk(self):
        yield self
        for child in self.children:
            for n in child.walk():
                yield n

    def add_child(self, obj):
        if not self.child_exists(obj):
            obj.parent_id = self.id
            obj.level = self.level + 1
            self.children.append(obj)

    def print_node(self, i=0):
        print((self.tab * i) + self.data)
        i += 1
        for child in self.children:
            child.print_node(i)

    def get_by_id(self, id):
        if self.id == id:
            return self
        else:
            for child in self.children:
                found = child.get_by_id(id)
                if found is not None:
                    return found
        return None

    def find(self, d):
        if self.data == d:
            return self
        else:
            for child in self.children:
                found = child.find(d)
                if found is not None:
                    return found
        return None

    def child_exists(self, child_node):
        for child in self.children:
            if child.data == child_node.data:
                return True
        return False

    def to_json(self):
        json_section = {
            'id': self.id,
            'section_name': self.data,
            'label': self.label,
            'level': self.level,
            'parent': self.parent_id
        }

        if len(self.children) > 0:
            ch = list()
            for child in self.children:
                ch.append(child.to_json())
                json_section['children'] = ch
        return json_section

    def collect_names(self, names_to_collect):
        parts = self.data.split(self.delimiter)
        for part in parts:
            names_to_collect.add(part)
        for child in self.children:
            child.collect_names(names_to_collect)


def create_sections_mapping(es: Elasticsearch, index_name, update=True):
    properties = {
        'properties': {
            'id': {'type': 'keyword'},
            'parent': {'type': 'keyword'},
            'label': {'type': 'keyword'},
            'level': {'type': 'long'},
            'section_name': {
                'type': 'text',
                'analyzer': 'path-analyzer'
            }
        }
    }
    request_body = {
        'settings': {
            'analysis': {
                'analyzer': {
                    'path-analyzer': {
                        'type': 'custom',
                        'tokenizer': 'path-tokenizer',
                        'filter': 'lowercase'
                    }
                },
                'tokenizer': {
                    'path-tokenizer': {
                        'type': 'path_hierarchy',
                        'delimiter': '/'
                    }
                }
            }
        },
        'mappings': {
            'sections': properties
        }
    }

    if update:
        response = es.indices.put_mapping(index=index_name, doc_type='sections', body=properties)
        print('Update: ', response)
    else:
        response = es.indices.create(index=index_name, body=request_body)
        print('Creation: ', response)

def get_tokens(es, string, delimiter):
    body = {
        'tokenizer': {
            'type':'path_hierarchy',
            'delimiter': '/'
        },
        'text': string
    }
    tokens = list()
    response = es.indices.analyze(body=body)
    for token in response['tokens']:
        tokens.append(token['token'])
    return tokens


def index_sections(es: Elasticsearch, root: Node, index_name):
    body = []
    for node in root.walk():
        json_node = node.to_json()
        if 'children' in json_node:
            json_node.pop('children')
        body.append({'index': {'_index': index_name, '_type': 'sections', '_id': json_node['id']}})
        body.append(json_node)
    es.bulk(body=body, index=index_name, doc_type='sections')


if __name__ == '__main__':
    corpora = [
        ['/disk1_data/EXTRA/Reuters dataset/json_v2/', 'reuters'],
        ['/disk1_data/EXTRA/APA dataset/json_v2/', 'apa']
    ]

    es = Elasticsearch()
    for i in 0, 1:
        print(corpora[i][1], 'corpus')
        create_sections_mapping(es, index_name=corpora[i][1])
        root = Node('sections', '/');
        slug_lines = set()
        for filename in os.listdir(corpora[i][0]):
            file = open( corpora[i][0] + filename, "r")
            json_article = json.load(file)
            slug_lines.add(json_article['slugline'])
        for slugline in slug_lines:
            current_root = root
            tokens = get_tokens(es, slugline, '/')
            for index in range(len(tokens)-1):
                pair = tokens[index : index+2]
                parent = current_root.find(pair[0])
                if parent is None:
                    parent = Node(pair[0], delimiter='/')
                    current_root.add_child(parent)
                    current_root = parent
                parent.add_child(Node(pair[1], delimiter='/'))

        print(corpora[i][1], 'index')
        index_sections(es, root, index_name=corpora[i][1])