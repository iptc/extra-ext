package org.iptc.extra.api.databind;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import org.iptc.extra.core.types.document.Document;
import org.iptc.extra.core.types.document.DocumentTopic;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeType;

public class DocumentDeserializer extends JsonDeserializer<Document> {

	@Override
	public Document deserialize(JsonParser jp, DeserializationContext ctxt) throws IOException, JsonProcessingException {
		
		Document document = new Document();
		
		JsonNode node = jp.getCodec().readTree(jp);
		Iterator<String> it = node.fieldNames();
		while(it.hasNext()) {
			String fieldName = it.next();
			JsonNode fieldNode = node.get(fieldName);
			
			if(fieldNode.getNodeType() == JsonNodeType.ARRAY && fieldName.equals("topics")) {
				
				List<DocumentTopic> topics = new ArrayList<DocumentTopic>();
				
				Iterator<JsonNode> topicsIterator = fieldNode.elements();
				while(topicsIterator.hasNext()) {
					JsonNode topicJsonNode = topicsIterator.next();

					DocumentTopic topic = new DocumentTopic();
					if(topicJsonNode.has("topicId")) {
						topic.setTopicId(topicJsonNode.get("topicId").asText());
						
						if(topicJsonNode.has("url")) {
							topic.setUrl(topicJsonNode.get("url").asText());
						}
						if(topicJsonNode.has("name")) {
							topic.setName(topicJsonNode.get("name").asText());
						}
						if(topicJsonNode.has("association")) {
							topic.setAssociation(topicJsonNode.get("association").asText());
						}
						if(topicJsonNode.has("parentTopic")) {
							topic.setParentTopic(topicJsonNode.get("parentTopic").asText());
						}
						
						topics.add(topic);
					}
					document.setTopics(topics);
				}
			}
			else {
				String value = fieldNode.asText();
				if(value != null) {
					if(fieldName.equals("id")) {
						document.setId(value);
					}
					else {
						document.addField(fieldName, value);
					}
				}
			}
		}
		
		return document;
	}

}
