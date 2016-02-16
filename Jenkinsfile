node {

   checkout scm

   docker.withRegistry('https://docker.example.com/', 'docker-registry-login') {
   
     def version = readFile 'src/version.txt' 
     def imagetag = "${version.trim()}.${env.BUILD_ID}"

     stage 'build'
     def app_image = docker.build("nodejs-demo:${imagetag}",'src/demo-app')
     def app_container = app_image.run("-i --name nodejs-demo-${imagetag}")

     stage 'unit tests'
     app_unit_image = docker.build("nodejs-demo-unit-tests:${imagetag}",'src/demo-app-unit-tests')
     def unit_container_id = runAttached(app_unit_image, "-i --name nodejs-demo-unit-tests-${imagetag}")
     docker.script.sh "docker logs ${unit_container_id} > result.txt 2>&1"
     def unit_results = readFile('result.txt')
     if (unit_results.trim().contains('npm info ok'))
     {
         echo '***** unit tests passed.'
     }
     else
     {
         error 'unit tests stage failed'
     }

     stage 'integration tests'
     app_int_image = docker.build("nodejs-demo-int-tests:${imagetag}",'src/demo-app-int-tests')
     def int_container_id = runAttached(app_int_image, "-i --link nodejs-demo-${imagetag}:demohost --name nodejs-demo-int-tests-${imagetag}")
     docker.script.sh "docker logs ${int_container_id} > result.txt 2>&1"
     def int_results = readFile('result.txt')
     if (int_results.trim().contains('npm info ok'))
     {
         echo '***** integration tests passed.'
     }
     else
     {
         error 'integration tests stage failed'
     }

     //app_container.stop()
     //docker.script.sh "docker stop ${unit_container_id} && docker rm -f ${unit_container_id}"
     //docker.script.sh "docker stop ${int_container_id} && docker rm -f ${int_container_id}"
     
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

