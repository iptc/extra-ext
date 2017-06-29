package org.iptc.extra.api.resources;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

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

import org.iptc.extra.api.datatypes.ClassificationInput;
import org.iptc.extra.api.datatypes.ErrorMessage;
import org.iptc.extra.api.datatypes.PagedResponse;
import org.iptc.extra.core.daos.RulesDAO;
import org.iptc.extra.core.daos.SchemasDAO;
import org.iptc.extra.core.es.ElasticSearchClient;
import org.iptc.extra.core.es.ElasticSearchResponse;
import org.iptc.extra.core.types.Rule;
import org.iptc.extra.core.types.Schema;
import org.iptc.extra.core.types.Schema.Field;
import org.iptc.extra.core.types.document.Document;
import org.iptc.extra.core.types.document.DocumentField;
import org.iptc.extra.core.types.document.Paragraph;
import org.iptc.extra.core.types.document.StructuredTextField;
import org.iptc.extra.core.utils.TextUtils;


@Singleton
@Path("classifications")
public class ClassificationsResource {

	@Inject
	private ElasticSearchClient es;
	
	@Inject
    private SchemasDAO schemasDAO;
	
    @Inject
    private RulesDAO rulesDAO;
    
	@POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response postDocument(ClassificationInput classificationInput,
    		@QueryParam("schemaId") String schemaId,
    		@QueryParam("groupId") String groupId,
    		@DefaultValue("20") @QueryParam("nPerPage") int nPerPage,
    		@DefaultValue("1") @QueryParam("page") int page) {
		
		try {
			Schema schema = schemasDAO.get(schemaId);
			if(schema == null) {
				ErrorMessage msg = new ErrorMessage("Schema " + schemaId + " does not exist");
				return Response.status(404).entity(msg).build();
			}
		
			Document document = classificationInput.getDocument();
			
			Set<String> documentFields = document.getFieldNames();
			Set<String> schemaFields = schema.getFieldNames();
			if(!schemaFields.containsAll(documentFields)) {
				documentFields.removeAll(schemaFields);
				ErrorMessage msg = new ErrorMessage("Document contains unknown fields: " + documentFields);
				return Response.status(400).entity(msg).build();
			}
			
			document = processDocument(document, schema);
			
			List<Rule> rules = new ArrayList<Rule>();
			ElasticSearchResponse<String> result = es.findRules(document, schema.getId(), groupId, page, nPerPage);
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
	        
		} catch (Exception e) {
			e.printStackTrace();
			ErrorMessage msg = new ErrorMessage("Classification failed!");
			return Response.status(400).entity(msg).build();
		}
		
    }
	
	private Document processDocument(Document document, Schema schema) {
	
		Set<String> fieldNames = document.getFieldNames();
		for(String fieldName : fieldNames) {
			DocumentField documentFieldValue = document.get(fieldName);
			Field field = schema.getField(fieldName);
			if(field.hasParagraphs || field.hasSentences) {
				if(!(documentFieldValue instanceof StructuredTextField)) {
					String textValue = documentFieldValue.toString();
					
					StructuredTextField structuredField = new StructuredTextField();
					structuredField.setValue(textValue);
					
					List<String> paragraphs = TextUtils.getParagraphs(textValue);
					
					if(field.hasParagraphs && !paragraphs.isEmpty()) {
						for(String paragraphText : paragraphs) {
							Paragraph paragraph = new Paragraph(paragraphText);
							structuredField.addParagraph(paragraph);
						}
					}
					else {
						Paragraph paragraph = new Paragraph(textValue);
						structuredField.addParagraph(paragraph);
					}			
					document.addField(fieldName, structuredField);
				}
			}
			
			if (field.textual) {
				documentFieldValue = document.get(fieldName);
				document.addField("raw_" + fieldName, documentFieldValue);
				document.addField("stemmed_" + fieldName, documentFieldValue);
				document.addField("case_sensitive__" + fieldName, documentFieldValue);
				document.addField("literal__" + fieldName, documentFieldValue);
			}
		}
		
		return document;
	}
}
