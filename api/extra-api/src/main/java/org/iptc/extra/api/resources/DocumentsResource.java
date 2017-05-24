package org.iptc.extra.api.resources;

import java.io.IOException;
import java.text.DecimalFormat;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import javax.inject.Inject;
import javax.inject.Singleton;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.lucene.search.join.ScoreMode;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilder;

import static org.elasticsearch.index.query.QueryBuilders.*;

import org.iptc.extra.api.responses.DocumentPagedResponse;
import org.iptc.extra.api.responses.ErrorMessage;

import org.iptc.extra.core.cql.CQLExtraParser;
import org.iptc.extra.core.cql.CQLMapper;
import org.iptc.extra.core.cql.SyntaxTree;
import org.iptc.extra.core.daos.CorporaDAO;
import org.iptc.extra.core.daos.RulesDAO;
import org.iptc.extra.core.daos.SchemasDAO;
import org.iptc.extra.core.es.ElasticSearchClient;
import org.iptc.extra.core.es.ElasticSearchResponse;
import org.iptc.extra.core.types.Corpus;
import org.iptc.extra.core.types.Rule;
import org.iptc.extra.core.types.Schema;
import org.iptc.extra.core.types.document.Document;
import org.iptc.extra.core.utils.TextUtils;

/**
 * Documents resource (exposed at "/documents" path)
 */
@Singleton
@Path("documents")
public class DocumentsResource {

	@Inject
	private ElasticSearchClient es;
	
	@Inject
    private RulesDAO dao;
	
	@Inject
    private CorporaDAO corporaDAO;

	@Inject
    private SchemasDAO schemasDAO;
	
	private CQLMapper mapper = new CQLMapper();
	
	@POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response searchDocuments(Rule rule, 
    		@QueryParam("corpus") String corpusId,
    		@QueryParam("match") String match,
    		@DefaultValue("20") @QueryParam("nPerPage") int nPerPage,
    		@DefaultValue("1") @QueryParam("page") int page) {
		
		try {			
			Corpus corpus = corporaDAO.get(corpusId);
			if(corpus == null) {
				ErrorMessage msg = new ErrorMessage("Cannot find corpus " + corpusId);
				return Response.status(400).entity(msg).build();
			}
			
			Schema schema = schemasDAO.get(corpus.getSchemaId());
			
			String corpusName = corpus.getName();
			
			Rule savedRule = dao.get(rule.getId());
			if(savedRule == null) {
				ErrorMessage msg = new ErrorMessage("Cannot find rule " + rule.getId());
				return Response.status(404).entity(msg).build();
			}
			
			QueryBuilder rulesQuery = getRuleQuery(rule);
			if(rulesQuery == null) {
				ErrorMessage msg = new ErrorMessage("CQL to ES translation failed.");
				return Response.status(400).entity(msg).build();
			}

			String topicId = savedRule.getTopicId();
			
			DocumentPagedResponse response = new DocumentPagedResponse();
			Map<String, Object> counts = getCountAnnotations(rulesQuery, topicId, corpusName);
			for(Entry<String, Object> count : counts.entrySet()) {
				response.addAnnotation(count.getKey(), count.getValue());
			}
			
			QueryBuilder qb = null;
			if(match.equals("topicMatches")) {
				qb = getTopicQuery(topicId);
			}
			else if(match.equals("bothMatches")) {
				qb = getRulesAndTopicQuery(rulesQuery, topicId);
			}
			else if(match.equals("ruleOnlyMatches")) {
				qb = getRulesOnlyQuery(rulesQuery, topicId);
			}
			else if(match.equals("topicOnlyMatches")) {
				qb = getTopicOnlyQuery(rulesQuery, topicId);
			}
			else {
				// rule matches
				qb = rulesQuery;
			}
			
			ElasticSearchResponse<Document> results = es.findDocuments(qb, corpusName, page, nPerPage, schema);	
			response.setEntries(results.getResults());
			
			response.setTotal(results.getFound());
			response.setnPerPage(nPerPage);
			response.setPage(page);

			return Response.status(200).entity(response).build();
			
		} catch (Exception e) {
			e.printStackTrace();
			ErrorMessage msg = new ErrorMessage(e.getMessage());
			return Response.status(400).entity(msg).build();
		}
		
		
	}
	
	private Map<String, Object> getCountAnnotations(QueryBuilder rulesQb, String topicId, String corpus) throws IOException {
		Map<String, Object> counts = new HashMap<String, Object>();
		
		long allDocuments = es.countDocuments(matchAllQuery(), corpus);
		
		long ruleMatches = es.countDocuments(rulesQb, corpus);
		
		QueryBuilder topicsQuery = getTopicQuery(topicId);
		long topicMatches = es.countDocuments(topicsQuery, corpus);
		
		QueryBuilder ruleAndTopicQuery = getRulesAndTopicQuery(rulesQb, topicId);
		long bothMatches = es.countDocuments(ruleAndTopicQuery, corpus);
		
		QueryBuilder onlyRuleQuery = getRulesOnlyQuery(rulesQb, topicId);
		long ruleOnlyMatches = es.countDocuments(onlyRuleQuery, corpus);
		
		QueryBuilder onlyTopicQuery = getTopicOnlyQuery(rulesQb, topicId);
		long topicOnlyMatches = es.countDocuments(onlyTopicQuery, corpus);
		
		counts.put("ruleMatches", ruleMatches);
		counts.put("topicMatches", topicMatches);
		counts.put("bothMatches", bothMatches);
		counts.put("ruleOnlyMatches", ruleOnlyMatches);
		counts.put("topicOnlyMatches", topicOnlyMatches);
		
		Double precision = ruleMatches == 0 ? 0 : (double) bothMatches / (double) ruleMatches;
		Double recall = topicMatches == 0 ? 0 : (double) bothMatches / (double) topicMatches;
		
		
		Double accuracy = allDocuments == 0 ? 0 : (double)(allDocuments - ruleOnlyMatches - topicOnlyMatches) / (double) allDocuments;
		
		DecimalFormat formatter = new DecimalFormat("###.###");
		
		counts.put("precision", formatter.format(precision));
		counts.put("recall", formatter.format(recall));
		counts.put("accuracy", formatter.format(accuracy));
		
		return counts;
	}
	
	private QueryBuilder getRuleQuery(Rule rule) {
		// parse rule 
		String cql = rule.getQuery();
		cql = TextUtils.clean(rule.getQuery());	
		SyntaxTree syntaxTree = CQLExtraParser.parse(cql);
		if(syntaxTree.hasErrors() || syntaxTree.getRootNode() == null) {
			return null;
		}
				
		QueryBuilder qb = mapper.toElasticSearch(syntaxTree.getRootNode());
		return qb;
				
	}
	
	private QueryBuilder getTopicQuery(String topicId) {
		
		BoolQueryBuilder bqb = boolQuery();
		bqb.must(termQuery("topics.id", topicId));
		bqb.must(termQuery("topics.exclude", false));
		bqb.must(boolQuery()
				.should(termQuery("topics.association", "why:direct"))
				.should(termQuery("topics.association", "userdefined")));
		
		
		QueryBuilder qb = nestedQuery("topics", bqb, ScoreMode.Total);
		return qb;
	}
	
	private QueryBuilder getRulesAndTopicQuery(QueryBuilder rulesQb, String topicId) {
		BoolQueryBuilder qb = boolQuery();
		qb.must(rulesQb);
		
		QueryBuilder topicQb = getTopicQuery(topicId);
		qb.must(topicQb);
		
		return qb;
	}
	
	private QueryBuilder getRulesOnlyQuery(QueryBuilder rulesQb, String topicId) {
		BoolQueryBuilder qb = boolQuery();
		qb.must(rulesQb);
		
		QueryBuilder topicQb = getTopicQuery(topicId);
		qb.mustNot(topicQb);
		
		return qb;
	}
	
	private QueryBuilder getTopicOnlyQuery(QueryBuilder rulesQb, String topicId) {
		
		BoolQueryBuilder qb = boolQuery();
		
		QueryBuilder topicQb = getTopicQuery(topicId);
		qb.must(topicQb);
		
		qb.mustNot(rulesQb);
		
		return qb;
	}
	
}