package org.iptc.extra.api;

import java.util.Properties;

import org.glassfish.jersey.server.ResourceConfig;
import org.iptc.extra.api.binder.ApplicationBinder;
import org.iptc.extra.api.databind.DocumentPagedResponseSerializer;
import org.iptc.extra.api.databind.DocumentSerializer;
import org.iptc.extra.api.responses.DocumentPagedResponse;
import org.iptc.extra.core.types.document.Document;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.jaxrs.json.JacksonJaxbJsonProvider;

/**
 * @author Petr Bouda (petr.bouda at oracle.com)
 */
public class Application extends ResourceConfig {

    

    public Application(Properties properties) {
    	packages(Application.class.getPackage().getName());
        register(new ApplicationBinder(properties));
        register(createJacksonJaxbJsonProvider());
        
        //register(createMoxyJsonResolver());
    }

    public static JacksonJaxbJsonProvider createJacksonJaxbJsonProvider() {
    	ObjectMapper mapper = new ObjectMapper();
    	
    	SimpleModule module = new SimpleModule();
    	module.addSerializer(Document.class, new DocumentSerializer());
    	module.addSerializer(DocumentPagedResponse.class, new DocumentPagedResponseSerializer());
  
    	mapper.registerModule(module);
    	
    	JacksonJaxbJsonProvider provider = new JacksonJaxbJsonProvider();
    	provider.setMapper(mapper);
 
    	return provider;
    }
    
    /*
    public static ContextResolver<MoxyJsonConfig> createMoxyJsonResolver() {
        final MoxyJsonConfig moxyJsonConfig = new MoxyJsonConfig();
        Map<String, String> namespacePrefixMapper = new HashMap<String, String>(1);
        namespacePrefixMapper.put("http://www.w3.org/2001/XMLSchema-instance", "xsi");
        moxyJsonConfig.setNamespacePrefixMapper(namespacePrefixMapper).setNamespaceSeparator(':');
        return moxyJsonConfig.resolver();
    }
    */
    
}