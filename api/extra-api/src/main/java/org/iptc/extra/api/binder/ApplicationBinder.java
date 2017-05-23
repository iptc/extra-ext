package org.iptc.extra.api.binder;

import java.net.UnknownHostException;
import java.util.Properties;

import javax.inject.Singleton;

import org.glassfish.hk2.utilities.binding.AbstractBinder;
import org.iptc.extra.api.ApplicationProperties;
import org.iptc.extra.core.daos.CorporaDAO;
import org.iptc.extra.core.daos.DictionariesDAO;
import org.iptc.extra.core.daos.RulesDAO;
import org.iptc.extra.core.daos.SchemasDAO;
import org.iptc.extra.core.daos.TaxonomiesDAO;
import org.iptc.extra.core.daos.TopicsDAO;
import org.iptc.extra.core.es.ElasticSearchClient;
import org.mongodb.morphia.Datastore;
import org.mongodb.morphia.Morphia;

import com.mongodb.MongoClient;

/**
 * @author Manos Schinas (manosetro@iti.gr)
 */
public class ApplicationBinder extends AbstractBinder {

    private final Properties properties;

    public ApplicationBinder(Properties properties) {
       this.properties = properties;
    }

    @Override
    protected void configure() {
    	
    	Morphia morphia = new Morphia();
    	bind(morphia).to(Morphia.class);
    	
    	if (properties != null) {
            for (String name : properties.stringPropertyNames()) {
                String value = properties.getProperty(name);
                bind(value).to(String.class).named(name);
            }
            
            String hostname = properties.getProperty(ApplicationProperties.MONGODB_HOST, "127.0.0.1");
            String port = properties.getProperty(ApplicationProperties.MONGODB_PORT, "27017");
            String database = properties.getProperty(ApplicationProperties.MONGODB_DATABASE, "test");
            	
            MongoClient mongoClient = new MongoClient(hostname, Integer.parseInt(port));
        	final Datastore datastore = morphia.createDatastore(mongoClient, database);
        	datastore.ensureIndexes();
        	
        	bind(Datastore.class).to(Singleton.class);
        	bind(datastore).to(Datastore.class);
        	
        	RulesDAO rulesDAO = new RulesDAO(datastore);
        	bind(rulesDAO).to(RulesDAO.class);
        	
        	SchemasDAO schemasDAO = new SchemasDAO(datastore);
        	bind(schemasDAO).to(SchemasDAO.class);
        	
        	DictionariesDAO dictionariesDAO = new DictionariesDAO(datastore);
        	bind(dictionariesDAO).to(DictionariesDAO.class);
        	
        	TopicsDAO topicsDAO = new TopicsDAO(datastore);
        	bind(topicsDAO).to(TopicsDAO.class);
        	
        	TaxonomiesDAO taxonomiesDAO = new TaxonomiesDAO(datastore);
        	bind(taxonomiesDAO).to(TaxonomiesDAO.class);
        	
        	CorporaDAO corporaDAO = new CorporaDAO(datastore);
        	bind(corporaDAO).to(CorporaDAO.class);
        	
        	String esHostname = properties.getProperty(ApplicationProperties.ES_HOST, "127.0.0.1");
        	int esPort = Integer.parseInt(properties.getProperty(ApplicationProperties.ES_PORT, "9300"));
        	ElasticSearchClient es;
			try {
				es = new ElasticSearchClient(esHostname, esPort);
	        	bind(es).to(ElasticSearchClient.class);
			} catch (UnknownHostException e) {
				e.printStackTrace();
			}
        }
    
    }
}