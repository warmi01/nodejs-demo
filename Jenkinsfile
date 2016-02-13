node {

   checkout scm

   docker.withRegistry('https://docker.example.com/', 'docker-registry-login') {

     stage 'build'
     def app_image = docker.build('nodejs-demo','src/demo-app')
     def app_container = app_image.run("-i --name nodejs-demo-${env.BUILD_ID}")

     stage 'unit tests'
     app_unit_image = docker.build('nodejs-demo-unit-tests','src/demo-app-unit-tests')
     def unit_id = runAttached(app_unit_image, "-i --name nodejs-demo-unit-tests-${env.BUILD_ID}")

     stage 'integration tests'
     app_int_image = docker.build('nodejs-demo-int-tests','src/demo-app-int-tests')
     def int_id = runAttached(app_int_image, "-i --link nodejs-demo-${env.BUILD_ID}:demohost --name nodejs-demo-int-tests-${env.BUILD_ID}")

     app_container.stop()
     docker.script.sh "docker stop ${unit_id} && docker rm -f ${unit_id}"
     docker.script.sh "docker stop ${int_id} && docker rm -f ${int_id}"
     
     def version = readFile 'src/version.txt' 
     def buildtag = "${version.trim()}.${env.BUILD_ID}"
     app_image.tag("${buildtag}");
     app_unit_image.tag("${buildtag}");
     app_int_image.tag("${buildtag}");
   }

}

def runAttached(image, args) {

   docker.node {
       try {
        docker.script.sh "rm .container"
       }
       catch (all) {} 
       docker.script.sh "docker run --cidfile=.container ${args != '' ? ' ' + args : ''} ${image.id}"
       def container = docker.script.readFile('.container').trim()
       docker.script.dockerFingerprintRun containerId: container, toolName: docker.script.env.DOCKER_TOOL_NAME
       return container
   }
}

