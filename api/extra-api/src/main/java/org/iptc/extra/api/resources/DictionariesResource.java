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
import org.iptc.extra.core.daos.DictionariesDAO;
import org.iptc.extra.core.types.Dictionary;
import org.mongodb.morphia.query.FindOptions;
import org.mongodb.morphia.query.Query;
import org.mongodb.morphia.query.QueryResults;

/**
 * Schemas resource (exposed at "/schemas" path)
 */
@Singleton
@Path("dictionaries")
public class DictionariesResource {

    @Inject
    private DictionariesDAO dao;
    
    
	@GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response getDictionaries(
		@DefaultValue("1") @QueryParam("page") int page,
		@DefaultValue("20") @QueryParam("nPerPage") int nPerPage) {
	
		
	Query<Dictionary> query = dao.createQuery();
	QueryResults<Dictionary> result = dao.find(query);
	
	FindOptions options = new FindOptions().skip((page-1)*nPerPage).limit(nPerPage);
	
	long total = result.count();
	List<Dictionary> dictionaries = result.asList(options);
	
	PagedResponse<Dictionary> response = new PagedResponse<Dictionary>();
	response.setEntries(dictionaries);
	response.setPage(page);
	response.setnPerPage(nPerPage);
	response.setTotal(total);

    return Response.ok(response).build();
	}
    		
	@POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Dictionary postDictionary(Dictionary dictionary) {
    	return null;
    }
	
	@GET @Path("{dictionaryid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getDictionary(@PathParam("dictionaryid") String dictionaryid) {
		
		Dictionary dictionary = dao.get(dictionaryid);
		if(dictionary == null) {
			ErrorMessage msg = new ErrorMessage("Dictionary " + dictionaryid + " not found");
			return Response.status(404).entity(msg).build();
		}
		
		return Response.status(200).entity(dictionary).build();
	}
	
	@PUT @Path("{dictionaryid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Dictionary putDictionary(@PathParam("dictionaryid") String dictionaryid) {
		return null;
	}
	
	@DELETE @Path("{dictionaryid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response deleteDictionary(@PathParam("dictionaryid") String dictionaryid) {
		
		Dictionary dictionary = dao.get(dictionaryid);
		if(dictionary == null) {
			ErrorMessage msg = new ErrorMessage("Dictionary " + dictionaryid + " not found");
			return Response.status(404).entity(msg).build();
		}
		
		dao.delete(dictionaryid);
		return Response.status(204).entity(dictionary).build();
	}
}
