import groovy.json.JsonSlurper

node {
   checkout scm

   docker.withRegistry('https://docker.example.com/', 'docker-registry-login') {

     stage 'build'
     sh 'cp Dockerfile_app Dockerfile'
     def app_image = docker.build('nodejs-demo','.')
     def app_container = app_image.run('-i -p 8082:3000 --name nodejs-demo')

     input "How does app look?"
     app_container.stop()

     stage 'test'
     sh 'cp Dockerfile_test Dockerfile'
     app_image = docker.build('nodejs-demo-test','.')
     app_container = app_image.run('-i -p 8082:3000 --name nodejs-demo-test')
     
     sh 'docker inspect ' + app_container.id + ' > container-info.txt 2>&1'
     def object = parseContainerInfo('container-info.txt')
     echo 'exitCode = ' + object.State.ExitCode

     input "How does test look?"
     app_container.stop()
   }
}

@NonCPS
def parseContainerInfo(String fileName) {
     echo 'i am here'	 
     echo fileName	 
     def text = readFile(fileName)
     text = '''[
    {
    "Id": "25bf88b0c7f93c546d7ff614071c7739600d4556a40e921cd58cb90fdb861504",
    "Created": "2016-01-21T15:52:08.679621567Z",
    "Path": "npm",
    "Args": [
        "test"
    ],
    "State": {
        "Running": false,
        "Paused": false,
        "Restarting": false,
        "OOMKilled": false,
        "Dead": false,
        "Pid": 0,
        "ExitCode": 0,
        "Error": "",
        "StartedAt": "2016-01-21T15:52:11.296466333Z",
        "FinishedAt": "2016-01-21T15:52:15.651625299Z"
    }]'''
     def json = new JsonSlurper().parseText(text)
     echo json
     json.each{
       println it
     }
     echo 'that was it'
     return json
}

public class ContainerInfo {

}

