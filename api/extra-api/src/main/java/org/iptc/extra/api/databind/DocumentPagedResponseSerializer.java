package org.iptc.extra.api.databind;

import java.io.IOException;

import org.iptc.extra.api.datatypes.DocumentPagedResponse;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

public class DocumentPagedResponseSerializer extends JsonSerializer<DocumentPagedResponse> {

	@Override
	public void serialize(DocumentPagedResponse resp, JsonGenerator gen, SerializerProvider serializers) throws IOException, JsonProcessingException {
		gen.writeStartObject();
		
		gen.writeNumberField("page", resp.getPage());
		gen.writeNumberField("total", resp.getTotal());
		gen.writeNumberField("nPerPage", resp.getnPerPage());
		
		gen.writeArrayFieldStart("entries");
		for(Object entry : resp.getEntries()) {
			gen.writeObject(entry);
		}
		gen.writeEndArray();
		
		gen.writeFieldName("annotations");
		gen.writeStartObject();
		for(String key : resp.getAnnotations().keySet()) {
			gen.writeStringField(key, resp.getAnnotation(key).toString());
		}
		gen.writeEndObject();
		
		gen.writeEndObject();
	}
}