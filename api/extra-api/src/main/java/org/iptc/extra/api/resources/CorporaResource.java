package org.iptc.extra.api.resources;

import java.util.List;

import javax.inject.Inject;
import javax.inject.Singleton;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

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
			@DefaultValue("1") @QueryParam("page") int page,
			@DefaultValue("20") @QueryParam("nPerPage") int nPerPage) {
		
		try {
			Query<Corpus> query = dao.createQuery();
			QueryResults<Corpus> result = dao.find(query);
		
			FindOptions options = new FindOptions().skip((page-1)*nPerPage).limit(nPerPage);
		
			long total = result.count();
			List<Corpus> corpora = result.asList(options);
		
			for(Corpus corpus : corpora) {
				if(corpus.getSchemaId() != null) {
					Schema schema = schemasDAO.get(corpus.getSchemaId());
					corpus.setSchema(schema);
				}
				
				if(corpus.getTaxonomyId() != null) {
					Taxonomy taxonomy = taxonomiesDAO.get(corpus.getTaxonomyId());
					corpus.setTaxonomy(taxonomy);
				}
			}
			
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
	
	@DELETE @Path("{corpusid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response deleteCorpus(@PathParam("corpusid") String corpusid) {
		
		Corpus corpus = dao.get(corpusid);
		if(corpus == null) {
			ErrorMessage msg = new ErrorMessage("Corpus " + corpusid + " not found");
			return Response.status(404).entity(msg).build();
		}
		
		dao.delete(corpusid);
		return Response.status(204).entity(corpusid).build();
	}
}
