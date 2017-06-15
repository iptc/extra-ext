package org.iptc.extra.api.databind;

import java.io.IOException;
import java.util.Iterator;

import org.iptc.extra.core.types.document.Document;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

public class DocumentDeserializer extends JsonDeserializer<Document> {

	@Override
	public Document deserialize(JsonParser jp, DeserializationContext ctxt) throws IOException, JsonProcessingException {
		
		Document document = new Document();
		
		JsonNode node = jp.getCodec().readTree(jp);
		Iterator<String> it = node.fieldNames();
		while(it.hasNext()) {
			String fieldName = it.next();
			String value = node.get(fieldName).asText();
			if(value != null) {
				document.addField(fieldName, value);
			}
		}
		
		return document;
	}

}
