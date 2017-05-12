package org.iptc.extra.api.databind;

import java.io.IOException;
import java.util.List;

import org.iptc.extra.core.types.document.Document;
import org.iptc.extra.core.types.document.DocumentField;
import org.iptc.extra.core.types.document.Paragraph;
import org.iptc.extra.core.types.document.StructuredTextField;
import org.iptc.extra.core.types.document.TextField;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

public class DocumentSerializer extends JsonSerializer<Document> {

	@Override
	public void serialize(Document document, JsonGenerator gen, SerializerProvider serializers) throws IOException, JsonProcessingException {
		gen.writeStartObject();
		
		gen.writeStringField("id", document.getId());
		for(String fieldName : document.getFieldNames()) {
			DocumentField field = document.get(fieldName);
			if(field instanceof StructuredTextField) {
				StructuredTextField structuredTextField = (StructuredTextField) field;
				gen.writeStringField(fieldName, structuredTextField.getValue());
				
				List<Paragraph> paragraphs = structuredTextField.getParagraphs();
				gen.writeArrayFieldStart(fieldName + "_paragraphs");
				for(Paragraph paragraph : paragraphs) {
					gen.writeStartObject();
					gen.writeStringField("paragraph", paragraph.toString());
					gen.writeEndObject();
				}
				gen.writeEndArray();
			}
			else if(field instanceof TextField) {
				gen.writeStringField(fieldName, ((TextField) field).getValue());
			}
			
		}
		gen.writeEndObject();
	}
}