FROM java:8
MAINTAINER Manos Schinas manosetro@iti.gr

RUN cd extra-api	&& mvn clean compile assembly:single && cp target/extra-api-0.1-SNAPSHOT-jar-with-dependencies.jar /extra-api.jar
WORKDIR /

ENTRYPOINT java -jar extra-api.jar
