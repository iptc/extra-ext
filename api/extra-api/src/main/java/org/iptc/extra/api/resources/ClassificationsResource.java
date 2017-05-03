package org.iptc.extra.api.resources;

import javax.inject.Singleton;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.iptc.extra.core.types.document.Document;


@Singleton
@Path("classifications")
public class ClassificationsResource {

	@POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Response postDocument(Document document) {
    	return null;
    }
	
}
