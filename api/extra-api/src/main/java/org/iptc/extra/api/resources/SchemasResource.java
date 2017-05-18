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

import org.bson.types.ObjectId;
import org.iptc.extra.api.responses.ErrorMessage;
import org.iptc.extra.api.responses.PagedResponse;
import org.iptc.extra.core.daos.SchemasDAO;
import org.iptc.extra.core.types.Schema;
import org.mongodb.morphia.Key;
import org.mongodb.morphia.query.FindOptions;
import org.mongodb.morphia.query.Query;
import org.mongodb.morphia.query.QueryResults;
import org.mongodb.morphia.query.UpdateOperations;

/**
 * Schemas resource (exposed at "/schemas" path)
 */
@Singleton
@Path("schemas")
public class SchemasResource {

    @Inject
    private SchemasDAO dao; 
    
	@GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getSchemas(
    		@DefaultValue("1") @QueryParam("page") int page,
    		@DefaultValue("20") @QueryParam("nPerPage") int nPerPage) {
		
		Query<Schema> query = dao.createQuery();
		QueryResults<Schema> result = dao.find(query);
    	
    	FindOptions options = new FindOptions().skip((page-1)*nPerPage).limit(nPerPage);
    	
    	long total = result.count();
		List<Schema> schemas = result.asList(options);
    	
		PagedResponse<Schema> response = new PagedResponse<Schema>();
		response.setEntries(schemas);
		response.setPage(page);
		response.setnPerPage(nPerPage);
		response.setTotal(total);
	
        return Response.ok(response).build();
	}
    		
	@POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response postSchema(Schema schema) {
		String id = schema.getId();
    	if(id != null && dao.exists(id)) {
    		ErrorMessage msg = new ErrorMessage("Conflict. Schema " + id + " already exists.");
			return Response.status(409).entity(msg).build();
    	}
    	else {
    		Key<Schema> createdSchemaKey = dao.save(schema);
    		schema.setId(createdSchemaKey.getId().toString());
    		
    		return Response.status(201).entity(schema).build();
    	}
    }
	
	@GET @Path("{schemaid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getSchema(@PathParam("schemaid") String schemaid) {
		Schema schema = dao.get(schemaid);
		if(schema == null) {
			ErrorMessage msg = new ErrorMessage("Schema " + schema + " not found");
			return Response.status(404).entity(msg).build();
		}
		
		return Response.status(200).entity(schema).build();
	}
	
	@PUT @Path("{schemaid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response putSchema(@PathParam("schemaid") String schemaid, Schema newSchema) {
		Schema schema = dao.get(schemaid);
		if(schema == null) {
			ErrorMessage msg = new ErrorMessage("Schema " + schema + " not found");
			return Response.status(404).entity(msg).build();
		}
		
		Query<Schema> query = dao.createQuery().filter("_id", new ObjectId(schemaid));
		UpdateOperations<Schema> ops = dao.createUpdateOperations()
				.set("name", newSchema.getName())
				.set("language", newSchema.getLanguage())
				.set("fields", newSchema.getFields());
		
		dao.update(query, ops);
		
		return Response.status(201).entity(newSchema).build();
	}
	
	@DELETE @Path("{schemaid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response deleteSchema(@PathParam("schemaid") String schemaid) {
		try {
			Schema schema = dao.get(schemaid);
			if(schema == null) {
				ErrorMessage msg = new ErrorMessage("Schema " + schema + " not found");
				return Response.status(404).entity(msg).build();
			}
			
			dao.deleteById(schemaid);

			return Response.status(204).entity(schema).build();
		}
		catch(Exception e) {
			return Response.status(400).entity(e.getMessage()).build();
		}
	}
}
