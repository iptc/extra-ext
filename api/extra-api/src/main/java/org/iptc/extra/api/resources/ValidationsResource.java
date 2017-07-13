package org.iptc.extra.api.resources;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.inject.Inject;
import javax.inject.Singleton;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.GenericEntity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.commons.lang3.StringUtils;

import org.elasticsearch.index.query.QueryBuilder;
import org.iptc.extra.api.datatypes.Message;
import org.iptc.extra.core.daos.CorporaDAO;
import org.iptc.extra.core.daos.RulesDAO;
import org.iptc.extra.core.daos.SchemasDAO;
import org.iptc.extra.core.eql.EQLMapper;
import org.iptc.extra.core.eql.EQLParser;
import org.iptc.extra.core.eql.tree.SyntaxTree;
import org.iptc.extra.core.eql.tree.nodes.ErrorMessageNode;
import org.iptc.extra.core.eql.tree.nodes.Node;
import org.iptc.extra.core.eql.tree.nodes.ReferenceClause;
import org.iptc.extra.core.eql.tree.utils.TreeUtils;
import org.iptc.extra.core.eql.tree.visitor.EQLValidator;
import org.iptc.extra.core.types.Corpus;
import org.iptc.extra.core.types.Rule;
import org.iptc.extra.core.types.Schema;
import org.iptc.extra.core.utils.TextUtils;


@Singleton
@Path("validations")
public class ValidationsResource {
	
	private EQLMapper mapper = new EQLMapper();
	
	@Inject
    private RulesDAO rulesDAO;
	
	@Inject
    private CorporaDAO corporaDAO;
	
	@Inject
    private SchemasDAO schemasDAO;
	
	@POST
    @Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
    public Response postRuleValidation(Rule rule, @QueryParam("corpus") String corpusId) {
		try {
			
			String query = rule.getQuery();	
			
			Map<String, Object> response = new HashMap<String, Object>();
			response.put("es_dsl", "");	
			response.put("tree", "");	
			response.put("html", "");	
			response.put("query", query);
			
			query = TextUtils.clean(query);
			rule.setQuery(query);
			
			SyntaxTree syntaxTree = EQLParser.parse(query);
			Node root = syntaxTree.getRootNode();
			
			StringBuffer message = new StringBuffer();
			
			Corpus corpus = corporaDAO.get(corpusId);
			Schema schema = schemasDAO.get(corpus.getSchemaId());
			
			if(syntaxTree.hasErrors() || syntaxTree.getRootNode() == null) {
				response.put("valid", "false");
				message.append(StringUtils.join(syntaxTree.getErrors(), "</br>"));
			}
			else {		
				List<ErrorMessageNode> invalidNodes = EQLValidator.validate(root, schema);
				if(invalidNodes.isEmpty()) {
					response.put("valid", "true");
				}
				else {
					response.put("valid", "false");
					message.append("</br> The rule has invalid operators/relations: </br> - " + StringUtils.join(invalidNodes, "</br> - "));
				}
				
				List<ReferenceClause> references = TreeUtils.getReferences(root);
				if(!references.isEmpty()) {
					for(ReferenceClause reference : references) {
						String refRuleId = reference.getRuleId();
						Rule refRule = rulesDAO.get(refRuleId);
						if(refRule == null) {
							response.put("valid", "false");
							reference.setValid(false);
							message.append("</br> Rule " + refRuleId + " does not exist.");
						}
						else {
							reference.setRule(refRule);
							TreeUtils.validateReferenceRule(reference, schema);
						}
					}
				}
				
				Set<String> unmatchedIndices = TreeUtils.validateSchema(root, schema);	
				if(!unmatchedIndices.isEmpty()) {
					response.put("valid", "false");
					message.append("</br> Cannot match " + schema.getName() + " due to invalid indices: " + unmatchedIndices);
				}
			}
			
			if(root != null) {
				if(response.get("valid").equals("true")) {
					QueryBuilder qb = mapper.toElasticSearchQuery(root, schema);
					if(qb != null) {
						String esDSL = "{ \"query\": " + qb.toString() + "}";
						response.put("es_dsl", esDSL);	
					}
					else {
						System.out.println("ES QUERY IS NULL!!!");
					}
				}
				
				String htmlTaggedCql = mapper.toHtml(root, "div");
				if(htmlTaggedCql != null) {
					response.put("html", htmlTaggedCql);
				}
				
				query = mapper.toString(root, "<br/>", "&emsp;");
				if(query != null) {
					response.put("query", query);
				}
				
				String jstree = mapper.toJSTree(root);
				if(jstree != null) {
					response.put("tree", jstree);
				}
				
				Set<String> indices = TreeUtils.getIndices(root);
				response.put("indices", indices);
				
			}
			
			response.put("message", message.toString());
			response.put("rule", rule);
			
			GenericEntity<Map<String, Object>> entity = new GenericEntity<Map<String, Object>>(response) {};
			return Response.ok().entity(entity).build();
		}
		catch(Exception e) {
			e.printStackTrace();
			Message error = new Message(e.getMessage());
			return Response.status(400).entity(error).build();
		}
	}
	
	@POST @Path("{schemaid}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response postRuleValidation(@PathParam("schemaid") String schemaid, Rule rule) {
		
		return null;
	}
}
