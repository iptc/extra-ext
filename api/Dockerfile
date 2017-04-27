FROM openjdk:8
MAINTAINER Manos Schinas manosetro@iti.gr

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y maven

RUN mkdir -p /opt/app
WORKDIR /opt/app


# selectively add the POM file and install dependencies
COPY extra-api/pom.xml /opt/app/
RUN mvn install

# add rest of the project and build it
COPY extra-api/src /opt/app/src
RUN mvn package

# local application port
EXPOSE 8888

# execute it
CMD ["mvn", "exec:java"]
