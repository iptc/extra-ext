package org.iptc.extra.api.resources;

import java.io.IOException;
import java.util.List;

import javax.inject.Inject;
import javax.inject.Singleton;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.GenericEntity;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Request;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

import org.bson.types.ObjectId;
import org.elasticsearch.index.query.QueryBuilder;
import org.iptc.extra.api.datatypes.ErrorMessage;
import org.iptc.extra.api.datatypes.PagedResponse;
import org.iptc.extra.core.cql.CQLExtraParser;
import org.iptc.extra.core.cql.CQLMapper;
import org.iptc.extra.core.cql.SyntaxTree;
import org.iptc.extra.core.cql.tree.Node;
import org.iptc.extra.core.daos.CorporaDAO;
import org.iptc.extra.core.daos.RulesDAO;
import org.iptc.extra.core.daos.SchemasDAO;
import org.iptc.extra.core.es.ElasticSearchClient;
import org.iptc.extra.core.types.Corpus;
import org.iptc.extra.core.types.Rule;
import org.iptc.extra.core.types.Schema;
import org.iptc.extra.core.utils.TextUtils;
import org.mongodb.morphia.Key;
import org.mongodb.morphia.query.FindOptions;
import org.mongodb.morphia.query.Query;
import org.mongodb.morphia.query.QueryResults;
import org.mongodb.morphia.query.UpdateOperations;

import com.mongodb.WriteResult;

/**
 * Rules resource (exposed at "/rules" path)
 */
@Singleton
@Path("rules")
public class RulesResource {

	@Context
    private HttpHeaders httpHeaders;
    
	@Context 
	private Request request;
	
    @Context
    private UriInfo uriInfo;

    @Inject
    private RulesDAO dao;
    
	@Inject
    private CorporaDAO corporaDAO;

	@Inject
    private SchemasDAO schemasDAO;
	
	@Inject
	private ElasticSearchClient es;
	
    private CQLMapper mapper = new CQLMapper();
    
    /**
     * Get a collection of rules based on filtering criteria like user, status and category
     * @return Rule that will be returned as a application/json response.
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getRules(
    		@QueryParam("uid") String uid,
    		@QueryParam("status") String status,
    		@QueryParam("taxonomy") String taxonomy,
    		@QueryParam("topicId") String topic,
    		@QueryParam("q") String q,
    		@DefaultValue("1") @QueryParam("page") int page,
    		@DefaultValue("20") @QueryParam("nPerPage") int nPerPage) {
    	
    	Query<Rule> query = dao.createQuery();
	    
    	if(uid != null && !uid.equals("")) {
    		query = query.field("uid").equal(uid);
    	}
    	
    	if(status != null && !status.equals("")) {
    		query = query.field("status").equal(status);
    	}
    	
    	if(taxonomy != null && !taxonomy.equals("")) {
    		query = query.field("taxonomy").equal(taxonomy);
    	}
    	
    	if(topic != null && !topic.equals("")) {
    		query = query.field("topicId").equal(topic);
    	}
    	
    	if(q != null && !q.equals("")) {
    		query.field("name").contains(q);
		 }
    	
    	query = query.order("-createdAt");
    	QueryResults<Rule> result = dao.find(query);
    	
    	FindOptions options = new FindOptions().skip((page-1)*nPerPage).limit(nPerPage);
    	
    	long total = result.count();
		List<Rule> rules = result.asList(options);
    	
		PagedResponse<Rule> response = new PagedResponse<Rule>();
		response.setEntries(rules);
		response.setPage(page);
		response.setnPerPage(nPerPage);
		response.setTotal(total);
		
		GenericEntity<PagedResponse<Rule> > entity = new GenericEntity<PagedResponse<Rule> >(response) {};
        return Response.ok(entity).build();
    }
    
    /**
     * Create a new rule as defined in the body of the method
     * @return Rule that will be returned as a application/json response.
     */
    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response postRule(Rule rule) {
    	
    	String id = rule.getId();
    	if(id != null && dao.exists(id)) {
    		ErrorMessage msg = new ErrorMessage("Conflict. Rule " + id + " already exists.");
			return Response.status(409).entity(msg).build();
    	}
    	else {
    		rule.setStatus("new");
    		
    		long t = System.currentTimeMillis();
    		rule.setCreatedAt(t);
    		rule.setUpdatedAt(t);
    		
    		String query = rule.getQuery();
    		if(query != null) {
    			query = TextUtils.clean(query);
    			rule.setQuery(query);
    		}
    		
    		Key<Rule> createdRuleKey = dao.save(rule);
    		rule.setId(createdRuleKey.getId().toString());
    		
    		return Response.status(201).entity(rule).build();
    	}
    }
    
    
    /**
	 * Retrieve the rule defined by the specific rule id
	 * 
	 * @param ruleid
	 * @return Rule
	 */
	@GET @Path("{ruleid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getRule(@PathParam("ruleid") String ruleid) {

		Rule rule = dao.get(ruleid);
		if(rule == null) {
			ErrorMessage msg = new ErrorMessage("Rule " + ruleid + " not found");
			return Response.status(404).entity(msg).build();
		}
		
		try {
			
			String query = TextUtils.clean(rule.getQuery());
			rule.setQuery(query);
			
			SyntaxTree syntaxTree = CQLExtraParser.parse(query);
			if(!syntaxTree.hasErrors() && syntaxTree.getRootNode() != null) {
				query = mapper.toString(syntaxTree.getRootNode(), "<br/>", "&emsp;");
				if(query != null) {
					rule.setQuery(query);
				}
			}
		}
		catch(Exception e) {
			e.printStackTrace();
		}
		
		return Response.status(200).entity(rule).build();
		
	}
	 
	@PUT @Path("{ruleid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response putRule(@PathParam("ruleid") String ruleid, Rule newRule, 
			@QueryParam("groupId") String groupId,
			@QueryParam("schema") String schemaId) {

		Rule rule = dao.get(ruleid);
		if(rule == null) {
			ErrorMessage msg = new ErrorMessage("Rule " + ruleid + " not found");
			return Response.status(404).entity(msg).build();
		}
		
		String query = newRule.getQuery();
		if(query != null) {
			query = TextUtils.clean(query);
			rule.setQuery(query);
		}
		
		long t = System.currentTimeMillis();
		rule.setUpdatedAt(t);
		
		Query<Rule> q = dao.createQuery().filter("_id", new ObjectId(ruleid));
		UpdateOperations<Rule> ops = dao.createUpdateOperations()
				.set("query", query)
				.set("updatedAt", t);
		
		if(newRule.getStatus() != null) {
			rule.setStatus(newRule.getStatus());
			ops.set("status", newRule.getStatus());
		}
		else {
			rule.setStatus("draft");
			ops.set("status", "draft");
		}
		
		if(groupId != null) {
			ops.addToSet("group", groupId);
		}
		dao.update(q, ops);
		
		rule = dao.get(ruleid);
		if(rule.getStatus().equals("submitted") && schemaId != null) {
			try {
				submitRule(rule, schemaId, groupId);
			} catch (IOException e) {
				ErrorMessage msg = new ErrorMessage("Rule " + ruleid + " cannot be submitted: " + e.getMessage());
				return Response.status(400).entity(msg).build();
			}
		}
		
		return Response.status(201).entity(rule).build();
	}

	@PUT @Path("{ruleid}/_submit")
	@Produces(MediaType.APPLICATION_JSON)
	public Response submitRule(
			@PathParam("ruleid") String ruleid, 
			@QueryParam("corpus") String corpusId,
			@QueryParam("schema") String schemaId,
			@QueryParam("groupId") String groupId,
			Rule newRule) {
		
		Rule rule = dao.get(ruleid);
		if(rule == null) {
			ErrorMessage msg = new ErrorMessage("Rule " + ruleid + " not found");
			return Response.status(404).entity(msg).build();
		}
		
		try {
			if(schemaId == null || !schemasDAO.exists(schemaId)) {
				Corpus corpus = corporaDAO.get(corpusId);
				if(corpus == null) {
					ErrorMessage msg = new ErrorMessage("Cannot find corpus " + corpusId);
					return Response.status(400).entity(msg).build();
				}
				schemaId = corpus.getSchemaId();
			}
			
			Schema schema = schemasDAO.get(schemaId);
			
			// Validate rule
			String query = newRule.getQuery();
			
			SyntaxTree syntaxTree = CQLExtraParser.parse(query);
			Node root = syntaxTree.getRootNode();

			QueryBuilder qb = mapper.toElasticSearchQuery(root, schema);
			
			// Submit rule into percolate index
			es.createSchemaMapping(schema);
			es.submitRule(ruleid, qb, schema.getId(), groupId);
			
			Query<Rule> q = dao.createQuery().filter("_id", new ObjectId(ruleid));
			UpdateOperations<Rule> ops = dao.createUpdateOperations().set("status", "submitted");
			dao.update(q, ops);
			
		} catch (Exception e) {
			e.printStackTrace();
			ErrorMessage msg = new ErrorMessage("Rule " + ruleid + " cannot be submitted: " + e.getMessage());
			return Response.status(400).entity(msg).build();
		}
		
		
		return Response.status(201).entity(rule).build();
	}
	
	public void submitRule(Rule rule, String schemaId, String groupId) throws IOException {
		// Validate rule
		String ruleid = rule.getId();
		String query = rule.getQuery();
			
		SyntaxTree syntaxTree = CQLExtraParser.parse(query);
		Node root = syntaxTree.getRootNode();
			
		Schema schema = schemasDAO.get(schemaId);	
		QueryBuilder qb = mapper.toElasticSearchQuery(root, schema);
			
		// Submit rule into percolate index
		es.createSchemaMapping(schema);
		es.submitRule(ruleid, qb, schemaId, groupId);
	}
	
	@DELETE @Path("{ruleid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response deleteRule(@PathParam("ruleid") String ruleid) {
		
		Rule rule = dao.get(ruleid);
		if(rule == null) {
			ErrorMessage msg = new ErrorMessage("Rule " + ruleid + " not found");
			return Response.status(404).entity(msg).build();
		}

		//es.deleteRule(rule.getId(), indexName);
		
		WriteResult r = dao.deleteById(ruleid);
		if(r.getN() == 0) {
			ErrorMessage msg = new ErrorMessage("Rule " + ruleid + " failed to be deleted.");
			return Response.status(404).entity(msg).build();
		}
		
		return Response.status(204).entity(rule).build();
	}
}
