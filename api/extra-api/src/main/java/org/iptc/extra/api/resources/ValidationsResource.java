package org.iptc.extra.api.resources;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.inject.Singleton;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.GenericEntity;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.commons.lang3.StringUtils;

import org.elasticsearch.index.query.QueryBuilder;
import org.iptc.extra.api.responses.ErrorMessage;
import org.iptc.extra.core.cql.CQLExtraParser;
import org.iptc.extra.core.cql.CQLMapper;
import org.iptc.extra.core.cql.SyntaxTree;
import org.iptc.extra.core.cql.tree.Node;
import org.iptc.extra.core.cql.tree.utils.TreeUtils;
import org.iptc.extra.core.types.Rule;
import org.iptc.extra.core.utils.TextUtils;


@Singleton
@Path("validations")
public class ValidationsResource {
	
	private CQLMapper mapper = new CQLMapper();
	
	@POST
    @Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
    public Response postRuleValidation(Rule rule) {
		try {
			
			String query = rule.getQuery();	

			Map<String, Object> response = new HashMap<String, Object>();
			response.put("es_dsl", "");	
			response.put("tree", "");	
			response.put("html", "");	
			response.put("query", query);
			
			query = TextUtils.clean(query);
			rule.setQuery(query);
			
			SyntaxTree syntaxTree = CQLExtraParser.parse(query);
			if(syntaxTree.hasErrors() || syntaxTree.getRootNode() == null) {
				response.put("valid", "false");
				response.put("message", StringUtils.join(syntaxTree.getErrors(), " \n "));
			}
			else {
				Node root = syntaxTree.getRootNode();
				
				if(!TreeUtils.isTreeValid(root)) {
					List<Node> invalidNodes = TreeUtils.getInvalidNodes(root);
					response.put("valid", "false");
					response.put("message", "The rule has invalid operators/relations: " + StringUtils.join(invalidNodes, ", "));
				}
				else {
					response.put("valid", "true");
					response.put("message", "The rule has correct syntax.");
				}
				
				QueryBuilder qb = mapper.toElasticSearch(root);
				if(qb != null) {
					String esDSL = "{ \"query\": " + qb.toString() + "}";
					response.put("es_dsl", esDSL);	
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
			
			response.put("rule", rule);
			
			GenericEntity<Map<String, Object>> entity = new GenericEntity<Map<String, Object>>(response) {};
			return Response.ok().entity(entity).build();
		}
		catch(Exception e) {
			ErrorMessage error = new ErrorMessage(e.getMessage());
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
