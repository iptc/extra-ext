package org.iptc.extra.api;

import java.util.Properties;

import org.glassfish.jersey.server.ResourceConfig;
import org.iptc.extra.api.binder.ApplicationBinder;

/**
 * @author Petr Bouda (petr.bouda at oracle.com)
 */
public class Application extends ResourceConfig {

    

    public Application(Properties properties) {
    	packages(Application.class.getPackage().getName());
        //register(MoxyJsonFeature.class);
        //register(createMoxyJsonResolver());
        register(new ApplicationBinder(properties));
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