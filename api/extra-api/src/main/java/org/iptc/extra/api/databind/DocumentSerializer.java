package org.iptc.extra.api.databind;

import java.io.IOException;

import org.iptc.extra.core.types.document.Document;
import org.iptc.extra.core.types.document.DocumentField;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

public class DocumentSerializer extends JsonSerializer<Document> {

	@Override
	public void serialize(Document document, JsonGenerator gen, SerializerProvider serializers) throws IOException, JsonProcessingException {
		gen.writeStartObject();
		for(String fieldName : document.getFieldNames()) {
			DocumentField field = document.get(fieldName);
			gen.writeStringField(fieldName, field.getValue());
		}
		gen.writeEndObject();
	}
}