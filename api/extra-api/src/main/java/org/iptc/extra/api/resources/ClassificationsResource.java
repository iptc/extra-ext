package org.iptc.extra.api.resources;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.inject.Inject;
import javax.inject.Singleton;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.GenericEntity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.iptc.extra.api.responses.ErrorMessage;
import org.iptc.extra.api.responses.PagedResponse;
import org.iptc.extra.core.daos.RulesDAO;
import org.iptc.extra.core.daos.SchemasDAO;
import org.iptc.extra.core.daos.TaxonomiesDAO;
import org.iptc.extra.core.es.ElasticSearchClient;
import org.iptc.extra.core.es.ElasticSearchResponse;
import org.iptc.extra.core.types.Rule;
import org.iptc.extra.core.types.Schema;
import org.iptc.extra.core.types.Taxonomy;
import org.iptc.extra.core.types.document.Document;


@Singleton
@Path("classifications")
public class ClassificationsResource {

	@Inject
	ElasticSearchClient es;
	
	@Inject
    private SchemasDAO schemasDAO;

	@Inject
    private TaxonomiesDAO taxonomiesDAO;
	
    @Inject
    private RulesDAO rulesDAO;
    
	@POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response postDocument(Document document,
    		@QueryParam("schema") String schemaId,
    		@QueryParam("taxonomy") String taxonomyId,
    		@DefaultValue("20") @QueryParam("nPerPage") int nPerPage,
    		@DefaultValue("1") @QueryParam("page") int page) {
		
		Schema schema = schemasDAO.get(schemaId);
		if(schema == null) {
			ErrorMessage msg = new ErrorMessage("Schema " + schemaId + " does not exist");
			return Response.status(404).entity(msg).build();
		}
		// TODO: validate document fields and process document 
		
		Taxonomy taxonomy = taxonomiesDAO.get(taxonomyId);
		if(taxonomy == null) {
			ErrorMessage msg = new ErrorMessage("Taxonomy " + taxonomyId + " does not exist");
			return Response.status(404).entity(msg).build();
		}
		
		try {
			List<Rule> rules = new ArrayList<Rule>();
			ElasticSearchResponse<String> result = es.findRules(document, taxonomy.getId(), schema.getId(), page, nPerPage);
			for(String ruleId : result.getResults()) {
				Rule rule = rulesDAO.get(ruleId);
				if(rule != null) {
					rules.add(rule);
				}
			}
			
			PagedResponse<Rule> response = new PagedResponse<Rule>();
			response.setEntries(rules);
			response.setPage(page);
			response.setnPerPage(nPerPage);
			response.setTotal(result.getFound());
			
			GenericEntity<PagedResponse<Rule> > entity = new GenericEntity<PagedResponse<Rule> >(response) {};
	        return Response.ok(entity).build();
	        
		} catch (IOException e) {
			ErrorMessage msg = new ErrorMessage("Classification failed!");
			return Response.status(400).entity(msg).build();
		}
    }
	
}
