package org.iptc.extra.api.resources;

import java.io.IOException;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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

import org.apache.commons.lang3.tuple.Pair;
import org.apache.lucene.search.join.ScoreMode;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilder;

import static org.elasticsearch.index.query.QueryBuilders.*;

import org.iptc.extra.api.responses.ErrorMessage;
import org.iptc.extra.api.responses.PagedResponse;
import org.iptc.extra.core.cql.CQLMapper;
import org.iptc.extra.core.cql.CQLParser;
import org.iptc.extra.core.cql.SyntaxTree;
import org.iptc.extra.core.daos.RulesDAO;
import org.iptc.extra.core.es.ElasticSearchHandler;
import org.iptc.extra.core.types.Document;
import org.iptc.extra.core.types.Rule;
import org.iptc.extra.core.utils.TextUtils;

/**
 * Rules resource (exposed at "/documents" path)
 */
@Singleton
@Path("documents")
public class DocumentsResource {

	@Inject
	private ElasticSearchHandler es;
	
	@Inject
    private RulesDAO dao;
	
	private CQLMapper mapper = new CQLMapper();
	
	@POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response searchDocuments(Rule rule, 
    		@QueryParam("corpus") String corpus,
    		@QueryParam("match") String match,
    		@DefaultValue("20") @QueryParam("nPerPage") int nPerPage,
    		@DefaultValue("1") @QueryParam("page") int page) {
		
		
		try {			
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

			PagedResponse<Document> response = new PagedResponse<Document>();
			Map<String, Object> counts = getCountAnnotations(rulesQuery, topicId, corpus);
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
			
			List<String> fields = new ArrayList<String>();
			fields.add("title");
			fields.add("body");
			
			Pair<Integer, List<Document>> documents = es.findDocuments(qb, corpus, page, nPerPage, fields);			
			
			response.setEntries(documents.getValue());
			response.setTotal(documents.getKey());
			response.setnPerPage(nPerPage);
			response.setPage(page);

			return Response.status(200).entity(response).build();
			
		} catch (Exception e) {
			ErrorMessage msg = new ErrorMessage(e.getMessage());
			return Response.status(400).entity(msg).build();
		}
		
		
	}
	
	private Map<String, Object> getCountAnnotations(QueryBuilder rulesQb, String topicId, String corpus) throws IOException {
		Map<String, Object> counts = new HashMap<String, Object>();
		
		int allDocuments = es.countDocuments(matchAllQuery(), corpus);
		
		int ruleMatches = es.countDocuments(rulesQb, corpus);
		
		QueryBuilder topicsQuery = getTopicQuery(topicId);
		int topicMatches = es.countDocuments(topicsQuery, corpus);
		
		QueryBuilder ruleAndTopicQuery = getRulesAndTopicQuery(rulesQb, topicId);
		int bothMatches = es.countDocuments(ruleAndTopicQuery, corpus);
		
		QueryBuilder onlyRuleQuery = getRulesOnlyQuery(rulesQb, topicId);
		int ruleOnlyMatches = es.countDocuments(onlyRuleQuery, corpus);
		
		QueryBuilder onlyTopicQuery = getTopicOnlyQuery(rulesQb, topicId);
		int topicOnlyMatches = es.countDocuments(onlyTopicQuery, corpus);
		
		counts.put("ruleMatches", ruleMatches);
		counts.put("topicMatches", topicMatches);
		counts.put("bothMatches", bothMatches);
		counts.put("ruleOnlyMatches", ruleOnlyMatches);
		counts.put("topicOnlyMatches", topicOnlyMatches);
		
		double precision = ruleMatches == 0 ? 0 : (double) bothMatches / (double) ruleMatches;
		double recall = topicMatches == 0 ? 0 : (double) bothMatches / (double) topicMatches;
		
		
		double accuracy = allDocuments == 0 ? 0 : (double)(allDocuments - ruleOnlyMatches - topicOnlyMatches) / (double) allDocuments;
		
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
		SyntaxTree syntaxTree = CQLParser.parse(cql);
		if(syntaxTree.hasErrors() || syntaxTree.getRootNode() == null) {
			return null;
		}
				
		QueryBuilder qb = mapper.toElasticSearch(syntaxTree.getRootNode());
		return qb;
				
	}
	
	private QueryBuilder getTopicQuery(String topicId) {
		QueryBuilder qb = nestedQuery("mediatopics", termQuery("mediatopics.id", topicId), ScoreMode.Max);
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