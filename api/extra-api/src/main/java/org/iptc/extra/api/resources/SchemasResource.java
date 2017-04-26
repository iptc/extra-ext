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

import org.iptc.extra.api.responses.ErrorMessage;
import org.iptc.extra.api.responses.PagedResponse;
import org.iptc.extra.core.daos.SchemasDAO;
import org.iptc.extra.core.types.Schema;
import org.mongodb.morphia.query.FindOptions;
import org.mongodb.morphia.query.Query;
import org.mongodb.morphia.query.QueryResults;

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
    public Schema postSchema(Schema schema) {
    	return null;
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
	public Schema putSchema(@PathParam("schemaid") String schemaid) {
		return null;
	}
	
	@DELETE @Path("{schemaid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response deleteSchema(@PathParam("schemaid") String schemaid) {
		
		Schema schema = dao.get(schemaid);
		if(schema == null) {
			ErrorMessage msg = new ErrorMessage("Schema " + schema + " not found");
			return Response.status(404).entity(msg).build();
		}
		
		dao.delete(schema);
		return Response.status(204).entity(schema).build();
	}
}
