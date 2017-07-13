package org.iptc.extra.api.resources;

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
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.iptc.extra.api.datatypes.Message;
import org.iptc.extra.api.datatypes.PagedResponse;
import org.iptc.extra.core.daos.TaxonomiesDAO;
import org.iptc.extra.core.daos.TopicsDAO;
import org.iptc.extra.core.types.Taxonomy;
import org.iptc.extra.core.types.Topic;
import org.mongodb.morphia.Key;
import org.mongodb.morphia.query.FindOptions;
import org.mongodb.morphia.query.Query;
import org.mongodb.morphia.query.QueryResults;
import org.mongodb.morphia.query.UpdateOperations;

import com.mongodb.WriteResult;

@Singleton
@Path("taxonomies")
public class TaxonomyResource {

	
	@Inject
	private TopicsDAO dao;

	@Inject
	private TaxonomiesDAO taxonomiesDao;
	
	@GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getTaxonomies(
    		@DefaultValue("1") @QueryParam("page") int page,
    		@DefaultValue("20") @QueryParam("nPerPage") int nPerPage) {
		
		FindOptions options = new FindOptions().skip((page-1)*nPerPage).limit(nPerPage);
		 
		QueryResults<Taxonomy> result = taxonomiesDao.find();
		 
		long total = result.count();
		List<Taxonomy> taxonomies = result.asList(options);
		 
		for(Taxonomy taxonomy : taxonomies) {
			 long topics = dao.createQuery().filter("taxonomyId", taxonomy.getId()).count();
			 taxonomy.setTopics(topics);
		}
		
		PagedResponse<Taxonomy> response = new PagedResponse<Taxonomy>();
		response.setEntries(taxonomies);
		response.setTotal(total);
		response.setPage(page);
		response.setnPerPage(nPerPage);
		 
		return Response.status(200).entity(response).build();
	}
	
	 @POST
	 @Produces(MediaType.APPLICATION_JSON)
	 @Consumes(MediaType.APPLICATION_JSON)
	 public Response postTaxonomy(Taxonomy taxonomy) {
		 String id = taxonomy.getId();
		 if(id != null && taxonomiesDao.exists(id)) {
			 Message msg = new Message("Conflict. Taxonomy " + id + " already exists.");
			 return Response.status(409).entity(msg).build();
		 }
		 else {
			 Key<Taxonomy> createdTaxonomyKey = taxonomiesDao.save(taxonomy);
			 taxonomy.setId(createdTaxonomyKey.getId().toString());
	    		
			 return Response.status(201).entity(taxonomy).build();
		 }
	 }
	 
	 @GET @Path("{taxonomyid}")
	 @Produces(MediaType.APPLICATION_JSON)
	 public Response getTaxonomy(@PathParam("taxonomyid") String taxonomyid) {
		 
		 Taxonomy taxonomy = taxonomiesDao.get(taxonomyid);
		 if(taxonomy == null) {
			 Message msg = new Message("Taxonomy " + taxonomy + " not found");
			 return Response.status(404).entity(msg).build();
		 }
		 
		 Query<Topic> query = dao.createQuery().filter("taxonomyId", taxonomyid);
		 long topics = dao.count(query);
		 taxonomy.setTopics(topics);
		 
		 return Response.status(200).entity(taxonomy).build();
	 }
    		
	 @PUT @Path("{taxonomyid}")
	 @Produces(MediaType.APPLICATION_JSON)
	 public Response putTaxonomy(@PathParam("taxonomyid") String taxonomyid, Taxonomy taxonomy) {
		 return Response.status(200).entity(taxonomy).build();
	 }
	 
		
	 @DELETE @Path("{taxonomyid}")
	 @Produces(MediaType.APPLICATION_JSON)
	 public Response deleteTaxonomy(@PathParam("taxonomyid") String taxonomyid) {
		 
		 Taxonomy taxonomy = taxonomiesDao.get(taxonomyid);
		 if(taxonomy == null) {
			 Message msg = new Message("Taxonomy " + taxonomyid + " not found");
			 return Response.status(404).entity(msg).build();
		 }
			
		 WriteResult r = taxonomiesDao.deleteById(taxonomyid);
		 if(r.getN() == 0) {
			 Message msg = new Message("Taxonomy " + taxonomyid + " failed to be deleted");
			return Response.status(404).entity(msg).build();
		 }
			
		 return Response.status(204).entity(taxonomy).build();
	 }
	 
	 @GET @Path("{taxonomyid}/topics")
	 @Produces(MediaType.APPLICATION_JSON)
	 public Response getTaxonomyTopics(@PathParam("taxonomyid") String taxonomyid, @QueryParam("q") String q,
			 @DefaultValue("1") @QueryParam("page") int page, @DefaultValue("20") @QueryParam("nPerPage") int nPerPage) {
		 
		 try {
			 FindOptions options = new FindOptions().skip((page-1)*nPerPage).limit(nPerPage);
		 
			 Query<Topic> query = dao.createQuery().filter("taxonomyId", taxonomyid);
			 query = query.order("topicId");
			 
			 if(q != null && !q.equals("")) {
				 query.or(
						 query.criteria("name").contains(q),
						 query.criteria("topicId").contains(q)
						 );
			 }
			 
			 QueryResults<Topic> result = dao.find(query);
		 
			 long total = result.count();
			 List<Topic> topics = result.asList(options);
			 
			 PagedResponse<Topic> response = new PagedResponse<Topic>();
			 response.setEntries(topics);
			 response.setPage(page);
			 response.setnPerPage(nPerPage);
			 response.setTotal(total);
			 
			 return Response.status(200).entity(response).build();
		 } 
		 catch(Exception e) {
			 Message msg = new Message(e.getMessage());
			 return Response.status(400).entity(msg).build();
		 }
	 }

	 @POST @Path("{taxonomyid}/topics")
	 @Produces(MediaType.APPLICATION_JSON)
	 public Response postTaxonomyTopic(@PathParam("taxonomyid") String taxonomyid, Topic topic) {
		 
		 try {
			 topic.setId(taxonomyid + "#" + topic.getTopicId());
			 topic.setLabel(topic.getName() + " (" + topic.getTopicId() + ")");
			 topic.setTaxonomyId(taxonomyid);
			 
			 dao.save(topic);
 		
			 return Response.status(201).entity(topic).build();
		 }
		 catch(Exception e) {
			 Message msg = new Message(e.getMessage());
			 return Response.status(400).entity(msg).build();	
		 }
	 }
	 
	 @GET @Path("{taxonomyid}/topics/{topicid}")
	 @Produces(MediaType.APPLICATION_JSON)
	 public Response getTaxonomyTopic(
			 @PathParam("taxonomyid") String taxonomyid, 
			 @PathParam("topicid") String topicId,
			 Topic newTopic) {
		 
		 try {
			 Topic topic = dao.get(topicId, taxonomyid);
			 if(topic == null) {
				 Message msg = new Message("Topic " + topicId + " not found");
			 	return Response.status(404).entity(msg).build();	
			 }
		 
			 return Response.status(201).entity(topic).build();
		 }
		 catch(Exception e) {
			 Message msg = new Message(e.getMessage());
			 return Response.status(400).entity(msg).build();	
		 }
	 }
	 
	 @PUT @Path("{taxonomyid}/topics/{topicid}")
	 @Produces(MediaType.APPLICATION_JSON)
	 public Response putTaxonomyTopic(
			 @PathParam("taxonomyid") String taxonomyid, 
			 @PathParam("topicid") String topicId,
			 Topic newTopic) {
		 
		 try {
			 Topic topic = dao.get(topicId, taxonomyid);
			 if(topic == null) {
				 Message msg = new Message("Topic " + topicId + " not found");
					return Response.status(404).entity(msg).build();
			 }
			 
			 if(topicId.equals(newTopic.getTopicId())) {
				 Query<Topic> query = dao.createQuery().filter("topicId", topicId).filter("taxonomyId", taxonomyid);
				 UpdateOperations<Topic> ops = dao.createUpdateOperations()
						 .set("name", newTopic.getName())
						 .set("definition", newTopic.getDefinition());
				 
				 dao.update(query, ops);
				 
				 topic = dao.get(topicId, taxonomyid);
				 return Response.status(201).entity(topic).build();
			 }
			 else {
				 newTopic.setId(taxonomyid + "#" + newTopic.getTopicId());
				 newTopic.setLabel(topic.getName() + " (" + newTopic.getTopicId() + ")");
				 newTopic.setTaxonomyId(taxonomyid);
				 dao.save(newTopic);
				 
				 dao.delete(topicId, taxonomyid);
				 
				 return Response.status(201).entity(newTopic).build();
			 }
			 
		 }
		 catch(Exception e) {
			 Message msg = new Message(e.getMessage());
			 return Response.status(400).entity(msg).build();	
		 }
	 }
	 
	 @DELETE @Path("{taxonomyid}/topics/{topicid}")
	 @Produces(MediaType.APPLICATION_JSON)
	 public Response deleteTaxonomyTopic(
			 @PathParam("taxonomyid") String taxonomyid, 
			 @PathParam("topicid") String topicId) {

		 	try {
		 		Topic topic = dao.get(topicId, taxonomyid);
				if(topic == null) {
					Message msg = new Message("Topic " + topicId + " not found");
					return Response.status(404).entity(msg).build();
				}
				
				WriteResult r = dao.delete(topicId, taxonomyid);
				if(r.getN() == 0) {
					Message msg = new Message("Topic " + topicId + " failed to be deleted");
					return Response.status(404).entity(msg).build();
				}
			
				return Response.status(204).entity(topic).build();
		 	}
		 	catch(Exception e) {
		 		Message msg = new Message("Exception: " + e.getMessage());
				 return Response.status(400).entity(msg).build();
		 	}
	 }
	 
}
