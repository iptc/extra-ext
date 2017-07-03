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
import org.iptc.extra.core.daos.CorporaDAO;
import org.iptc.extra.core.daos.GroupDAO;
import org.iptc.extra.core.daos.RulesDAO;
import org.iptc.extra.core.daos.SchemasDAO;
import org.iptc.extra.core.eql.EQLMapper;
import org.iptc.extra.core.eql.EQLParser;
import org.iptc.extra.core.eql.SyntaxTree;
import org.iptc.extra.core.eql.tree.nodes.Node;
import org.iptc.extra.core.es.ElasticSearchClient;
import org.iptc.extra.core.types.Corpus;
import org.iptc.extra.core.types.Group;
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
    private GroupDAO groupDAO;
    
	@Inject
    private CorporaDAO corporaDAO;

	@Inject
    private SchemasDAO schemasDAO;
	
	@Inject
	private ElasticSearchClient es;
	
    private EQLMapper mapper = new EQLMapper();
    
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
    		@QueryParam("topicId") String topicId,
    		@QueryParam("groupId") String groupId,
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
    	
    	if(topicId != null && !topicId.equals("")) {
    		query = query.field("topicId").equal(topicId);
    	}
    	
    	if(groupId != null && !groupId.equals("")) {
    		query = query.field("group").contains(groupId);
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
    		if(query != null && query.equals("")) {
    			query = TextUtils.clean(query);
    			rule.setQuery(query);
    		}
    		
    		Key<Rule> createdRuleKey = dao.save(rule);
    		rule.setId(createdRuleKey.getId().toString());
    		
    		return Response.status(201).entity(rule).build();
    	}
    }
    
    @GET @Path("groups")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getGroups() {
    	try {
    		List<Group> groups = groupDAO.find().asList();

			PagedResponse<Group> response = new PagedResponse<Group>();
			response.setEntries(groups);
		
			return Response.status(200).entity(response).build();
    	}
    	catch(Exception e) {
    		e.printStackTrace();
    		ErrorMessage msg = new ErrorMessage("Exception " + e.getMessage());
			return Response.status(404).entity(msg).build();
    	}
	}
    
    @POST @Path("groups")
	@Produces(MediaType.APPLICATION_JSON)
	public Response postGroup(Group group) {
    	try {
    		String id = group.getId();
        	if(id != null && groupDAO.exists(id)) {
        		ErrorMessage msg = new ErrorMessage("Conflict. Group " + id + " already exists.");
    			return Response.status(409).entity(msg).build();
        	}
        	else {

        		Key<Group> createdGroupKey = groupDAO.save(group);
        		group.setId(createdGroupKey.getId().toString());
        		
        		return Response.status(201).entity(group).build();
        	}
    	}
    	catch(Exception e) {
    		e.printStackTrace();
    		ErrorMessage msg = new ErrorMessage("Exception " + e.getMessage());
			return Response.status(404).entity(msg).build();
    	}
	}
    
    @GET @Path("groups/{groupid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getGroup(@PathParam("groupid") String groupid) {
    	try {
    		Group group = groupDAO.get(groupid);
    		if(group == null) {
    			ErrorMessage msg = new ErrorMessage("Group " + groupid + " not found");
    			return Response.status(404).entity(msg).build();
    		}

			return Response.status(200).entity(group).build();
    	}
    	catch(Exception e) {
    		e.printStackTrace();
    		ErrorMessage msg = new ErrorMessage("Exception " + e.getMessage());
			return Response.status(404).entity(msg).build();
    	}
	}
    
    @DELETE @Path("groups/{groupid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response deleteGroup(@PathParam("groupid") String groupid) {
    	try {
    		Group group = groupDAO.get(groupid);
    		if(group == null) {
    			ErrorMessage msg = new ErrorMessage("Group " + groupid + " not found");
    			return Response.status(404).entity(msg).build();
    		}
    		
    		WriteResult r = groupDAO.deleteById(groupid);
    		if(r.getN() == 0) {
    			ErrorMessage msg = new ErrorMessage("Group " + groupid + " failed to be deleted.");
    			return Response.status(404).entity(msg).build();
    		}
    		
			return Response.status(204).entity(group).build();
    	}
    	catch(Exception e) {
    		e.printStackTrace();
    		ErrorMessage msg = new ErrorMessage("Exception " + e.getMessage());
			return Response.status(404).entity(msg).build();
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
			String query = rule.getQuery();
			if(query != null && !query.equals("")) {
				query = TextUtils.clean(query);
				rule.setQuery(query);	
				SyntaxTree syntaxTree = EQLParser.parse(query);
				if(!syntaxTree.hasErrors() && syntaxTree.getRootNode() != null) {
					query = mapper.toString(syntaxTree.getRootNode(), "<br/>", "&emsp;");
					if(query != null) {
						rule.setQuery(query);
					}
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
			@QueryParam("groupName") String groupName,
			@QueryParam("schema") String schemaId,
			@QueryParam("corpus") String corpusId) {

		try { 
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
			UpdateOperations<Rule> ops = dao.createUpdateOperations().set("updatedAt", t);
			
			if(query != null) {
				ops.set("query", query);
			}	
		
			String name = newRule.getName();
			if(name != null && !name.equals(rule.getName())) {
				ops.set("name", name);
			}
			
			String newStatus = newRule.getStatus();
			if(newStatus == null || (newStatus != null && newStatus.equals("new"))) {
				rule.setStatus("draft");
				ops.set("status", "draft");
			}
			else {
				if(!newStatus.equals("submitted")) {
					rule.setStatus(newStatus);
					ops.set("status", newStatus);
				}
			}
		
			// create group and add a reference in the rule
			if(groupId != null && groupName != null) {
				try {
					Group group = null;
					if(groupId.equals("")) {
						if(!groupName.equals("")) {
							group = groupDAO.findOne(groupDAO.createQuery().filter("name", groupName));
							if(group == null) {
								group = new Group();
								group.setName(groupName);
								Key<Group> r = groupDAO.save(group);
								groupId = r.getId().toString();
								group.setId(groupId);
							}
						}
					}
					else {
						group = groupDAO.get(groupId);
						if(group == null && !groupName.equals("")) {
							group = new Group(groupId, groupName);
						}
					}
			
					if(group != null) {
						ops.addToSet("group", groupId);
					}
				}
				catch(Exception e) {
					e.printStackTrace();
				}
			}
			dao.update(q, ops);

			rule = dao.get(ruleid);
			if(newStatus != null && newStatus.equals("submitted") && (schemaId != null || corpusId != null)) {
				try {
					if(schemaId == null || !schemasDAO.exists(schemaId)) {
						Corpus corpus = corporaDAO.get(corpusId);
						if(corpus == null) {
							ErrorMessage msg = new ErrorMessage("Cannot find corpus " + corpusId);
							return Response.status(400).entity(msg).build();
						}
						schemaId = corpus.getSchemaId();
					}
					
					submitRule(rule, schemaId, groupId);
				
					long submittedAt = System.currentTimeMillis();
					rule.setSubmittedAt(submittedAt);
					
					ops = dao.createUpdateOperations()
							.set("status", "submitted")
							.set("submittedAt",submittedAt)
							.addToSet("schemas", schemaId);
					
					dao.update(q, ops);
				
				} catch (IOException e) {
					ErrorMessage msg = new ErrorMessage("Rule " + ruleid + " cannot be submitted: " + e.getMessage());
					return Response.status(400).entity(msg).build();
				}
			}
			else if(rule.getStatus() != null && rule.getStatus().equals("submitted")) {
				for(String schema : rule.getSchemas()) {
					if(rule.getGroup().isEmpty()) {
						submitRule(rule, schema, groupId);
					}
					else {
						for(String group : rule.getGroup()) {
							submitRule(rule, schema, group);
						}
					}
				}
			}
			
			return Response.status(201).entity(rule).build();
		}
		catch(Exception e) {
			e.printStackTrace();
			ErrorMessage msg = new ErrorMessage("Excpetion " + e.getMessage());
			return Response.status(404).entity(msg).build();
		}
	}
	
	private void submitRule(Rule rule, String schemaId, String groupId) throws IOException {
		// Validate rule
		String ruleid = rule.getId();
		String query = rule.getQuery();
			
		SyntaxTree syntaxTree = EQLParser.parse(query);
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

		if(rule.getStatus() != null && rule.getStatus().equals("submitted")) {
			for(Schema schema : schemasDAO.find().asList()) {
				try {
					es.deleteRule(rule.getId(), schema.getId());
				} catch (IOException e) {
					ErrorMessage msg = new ErrorMessage("Rule " + ruleid + " failed to be deleted from percolate index");
					return Response.status(404).entity(msg).build();
				}	
			}
		}
		
		WriteResult r = dao.deleteById(ruleid);
		if(r.getN() == 0) {
			ErrorMessage msg = new ErrorMessage("Rule " + ruleid + " failed to be deleted.");
			return Response.status(404).entity(msg).build();
		}
		
		return Response.status(204).entity(rule).build();
	}
}
