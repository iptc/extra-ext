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
import org.iptc.extra.core.daos.CorporaDAO;
import org.iptc.extra.core.daos.SchemasDAO;
import org.iptc.extra.core.daos.TaxonomiesDAO;
import org.iptc.extra.core.types.Corpus;
import org.iptc.extra.core.types.Schema;
import org.iptc.extra.core.types.Taxonomy;
import org.mongodb.morphia.Key;
import org.mongodb.morphia.query.FindOptions;
import org.mongodb.morphia.query.Query;
import org.mongodb.morphia.query.QueryResults;
import org.mongodb.morphia.query.UpdateOperations;

/**
 * Coprora resource (exposed at "/corpora" path)
 */
@Singleton
@Path("corpora")
public class CorporaResource {

	@Inject
	private CorporaDAO dao;
	    
	@Inject
	private SchemasDAO schemasDAO;
	
	@Inject
	private TaxonomiesDAO taxonomiesDAO;
	
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	public Response getCoprora(
			@QueryParam("taxonomy") String taxonomy,
			@DefaultValue("1") @QueryParam("page") int page,
			@DefaultValue("20") @QueryParam("nPerPage") int nPerPage) {
		
		try {
			Query<Corpus> query = dao.createQuery();
			
			if(taxonomy != null && !taxonomy.equals("")) {
	    		query = query.field("taxonomyId").equal(taxonomy);
	    	}
			
			QueryResults<Corpus> result = dao.find(query);
		
			FindOptions options = new FindOptions().skip((page-1)*nPerPage).limit(nPerPage);
		
			long total = result.count();
			List<Corpus> corpora = result.asList(options);
			
			PagedResponse<Corpus> response = new PagedResponse<Corpus>();
			response.setEntries(corpora);
			response.setPage(page);
			response.setnPerPage(nPerPage);
			response.setTotal(total);

			return Response.ok(response).build();
		}
		catch(Exception e) {
			ErrorMessage msg = new ErrorMessage(e.getMessage());
			return Response.status(400).entity(msg).build();
		}
	}

	@POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response postCorpus(Corpus corpus) {
		try {
			String id = corpus.getId();
			if(id != null && dao.exists(id)) {
				ErrorMessage msg = new ErrorMessage("Conflict. Corpus " + id + " already exists.");
				return Response.status(409).entity(msg).build();
			}
			else {
				Key<Corpus> createdCorpusKey = dao.save(corpus);
				corpus.setId(createdCorpusKey.getId().toString());
	    		
	    		return Response.status(201).entity(corpus).build();
			}
		}
		catch(Exception e) {
			ErrorMessage msg = new ErrorMessage(e.getMessage());
			return Response.status(400).entity(msg).build();
		}
    }
	
	@GET @Path("{corpusid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getCorpus(@PathParam("corpusid") String corpusid) {
		
		Corpus corpus = dao.get(corpusid);
		if(corpus == null) {
			ErrorMessage msg = new ErrorMessage("Corpus " + corpusid + " not found");
			return Response.status(404).entity(msg).build();
		}
		
		if(corpus.getSchemaId() != null) {
			Schema schema = schemasDAO.get(corpus.getSchemaId());
			corpus.setSchema(schema);
		}
		
		if(corpus.getTaxonomyId() != null) {
			Taxonomy taxonomy = taxonomiesDAO.get(corpus.getTaxonomyId());
			corpus.setTaxonomy(taxonomy);
		}
		
		return Response.status(200).entity(corpus).build();
	}
	
	@PUT @Path("{corpusid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response putCorpus(@PathParam("corpusid") String corpusid, Corpus newCorpus) {
		
		Corpus corpus = dao.get(corpusid);
		if(corpus == null) {
			ErrorMessage msg = new ErrorMessage("Corpus " + corpusid + " not found");
			return Response.status(404).entity(msg).build();
		}
		
		Query<Corpus> query = dao.createQuery().filter("_id", new ObjectId(corpusid));
		UpdateOperations<Corpus> ops = dao.createUpdateOperations()
				.set("name", newCorpus.getName())
				.set("language", newCorpus.getLanguage())
				.set("schemaId", newCorpus.getSchemaId())
				.set("taxonomyId", newCorpus.getTaxonomyId());
		
		dao.update(query, ops);
		
		return Response.status(200).entity(newCorpus).build();
	}
	
	@DELETE @Path("{corpusid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response deleteCorpus(@PathParam("corpusid") String corpusid) {
		
		Corpus corpus = dao.get(corpusid);
		if(corpus == null) {
			ErrorMessage msg = new ErrorMessage("Corpus " + corpusid + " not found");
			return Response.status(404).entity(msg).build();
		}
		
		dao.deleteById(corpusid);
		return Response.status(204).entity(corpusid).build();
	}
}
