package org.iptc.extra.api;

import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.jersey.grizzly2.httpserver.GrizzlyHttpServerFactory;
import org.iptc.extra.api.binder.ApplicationBinder;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.util.Properties;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * App main class.
 *
 */
public class ServerApp {
	
	public static final String PROPS_FILE = "application.properties";
    
    public static void main(String[] args) {
        try {
        	Properties properties = getProperties(PROPS_FILE);
        	 
        	String baseUri = properties.getProperty(ApplicationProperties.BASE_URI, "http://0.0.0.0:8888/extra/api");
            
        	URI uri = URI.create(baseUri);
        	HttpServer server = GrizzlyHttpServerFactory.createHttpServer(uri, new Application(properties), false);
            
            Runtime.getRuntime().addShutdownHook(new Thread(server::shutdownNow));
            server.start();

            System.out.println("Application started.\n"
            		+ "REST API: " + uri + "\n"
            		+ "Stop the application using CTRL+C");

            Thread.currentThread().join();
        } catch (IOException | InterruptedException ex) {
            Logger.getLogger(ServerApp.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
    private static Properties getProperties(String path) {
        try (InputStream inputStream = ApplicationBinder.class.getClassLoader().getResourceAsStream(path)) {
            Properties properties = new Properties();
            properties.load(inputStream);
            return properties;
        } catch (Exception e) {
        	
        }
        return null;
    }
}

