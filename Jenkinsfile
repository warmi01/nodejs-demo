node {
     // Run the pipeline job
     
     sendBuildEvent("JOB_STARTED", null)
     try
     {  
          runPipeline()         
          sendBuildEvent("JOB_ENDED", "SUCCESS")
     }
     catch (all)
     {
          sendBuildEvent("JOB_ENDED", "FAILURE")
          error 'Pipeline job failed'
     }
}

def runPipeline()
{
     def images = ['app': null, 'app_tests': null]
     def containers = ['app': null, 'app_tests': null]
     
     checkout scm
     
     docker.withServer(env.CI_DOCKER_HOST) {
   
          try
          {
               def imagetag = "${env.BUILD_ID}"
               
               stage 'build docker images'
               buildImages(images, imagetag)
               
               stage 'run integration tests'
               runIntegrationTests(images, imagetag, containers)
               
               stage 'publish docker images'
               publishDockerImages(images, imagetag)
          }
          catch (all)
          {
               error 'Pipeline error'
          }
          finally
          {
               cleanup(images, containers)
          }    
     }
}

def getRootPath() {
     def path = (CI_ROOT_PATH ? CI_ROOT_PATH.trim() : '')
     if (path != "") 
     {
     	path = path + '/'
     }
     
     return path
}

def buildImages(images, imagetag) {

     sendBuildEvent("BUILD_STARTED", null)
     def root = getRootPath()
     
     try
     {
          // Build demo app image first (latest used as test image base)
          images.app = docker.build("${env.JOB_NAME}", "${root}src/demo-app")
          images.app.tag("${imagetag}")
          images.app = docker.image("${env.JOB_NAME}:${imagetag}")
            
          // Modify test dockerfile to match JOB_NAME
          sh "sed -i 's/nodejs-demo/${env.JOB_NAME}/g' ${root}src/demo-app-tests/Dockerfile"
          images.app_tests = docker.build("${env.JOB_NAME}-tests:${imagetag}", "${root}src/demo-app-tests")

          echo 'Docker builds for images successful'         
          sendBuildEvent("BUILD_ENDED", "SUCCESS")
     }
     catch (all)
     {
          sendBuildEvent("BUILD_ENDED", "FAILURE")
          error 'Build Images failed'
     }     
}

def runIntegrationTests(images, imagetag, containers) {
    
     sendBuildEvent("TEST_STARTED", null)
                    
     try
     {
         // Run demo app
         echo 'Running demo app..'
         containers.app = images.app.run("-i --name ${env.JOB_NAME}-${imagetag}")
            
         containers.app_tests = runAttached(images.app_tests, "-i --link ${env.JOB_NAME}-${imagetag}:demohost --name ${env.JOB_NAME}-tests-${imagetag}", 'npm run-script int-test')
         testResults(containers.app_tests)
                    
         sendBuildEvent("TEST_ENDED", "SUCCESS")
     }
     catch (all)
     {
         sendBuildEvent("TEST_ENDED", "FAILURE")
         error 'Integration tests failed'
     }
}

def runAttached(image, args, command) {

     docker.node {
     
          try {
               docker.script.sh "rm .container"
          }
          catch (all) {} 
          
          docker.script.sh "docker run --cidfile=.container ${args != '' ? args : ''} ${image.id} ${command != '' ? command : ''}"
          def container = docker.script.readFile('.container').trim()
          docker.script.dockerFingerprintRun containerId: container, toolName: docker.script.env.DOCKER_TOOL_NAME
          
          return container
     }
}

def testResults(container) {

     docker.script.sh "docker logs ${container} > result.txt 2>&1"
     def result = docker.script.readFile('result.txt').trim()

     if (result.contains('npm info ok'))
     {
          echo "Integration tests passed"
     }
     else
     {
          throw new Exception() 
     }
}

def cleanup(images, containers) {

     parallel "Stop demo app container":
     {
          try {
               containers.app.stop()
               docker.script.sh "docker rmi ${images.app.id}"
          }
          catch (all) {echo 'Error stopping demo app container'}
     },
     "Stop tests container":
     {
          try {
               docker.script.sh "docker stop ${containers.app_tests} && docker rm -f ${containers.app_tests}"
               docker.script.sh "docker rmi ${images.app_tests.id}"
          }
          catch (all) {echo 'Error stopping tests container'}
     },
     failFast: false
}

def publishDockerImages(images, imagetag) {

     sendBuildEvent("PUBLISH_STARTED", null)
     
     try {
          docker.withRegistry(env.CI_IMAGE_REGISTRY_URL, 'docker-registry-login') {
               
               images.app.push(imagetag)
               images.app_tests.push(imagetag)
          }
          
          sendBuildEvent("PUBLISH_ENDED", "SUCCESS")
     }
     catch (all) {
          sendBuildEvent("PUBLISH_ENDED", "FAILURE")
          echo 'Failed to tag/push to VDR image'
          error 'Failed to tag/push to VDR image'
     }
}

/**
 * Sends a build event to the build service.
 * @param type Stage event type
 * @param result Result for the stage.  Required for ENDED event types
 */
def sendBuildEvent(type, result)
{
    // Use the Platform Service Registry to communicate with the Build Service.
 
    // Get the event callback URL from the Jenkins job parameter.
    // Test existence of the parameter by trying to access it.
    def eventCallbackUrl
    try
    {
        eventCallbackUrl = CI_EVENT_CALLBACK.trim()
        if (eventCallbackUrl == "")
        {
            throw new Exception()
        }
    }
    catch (all)
    {
        echo 'Not sending build event since callback URL is not set'
        return    
    }
    
    // Create the URL for the Build Service Event REST API
    def serviceRegistry = env.SERVICE_REGISTRY_HOSTNAME
    def buildServiceServiceRegistryPath =
        (env.BUILD_SERVICE_SR_PATH || env.BUILD_SERVICE_SR_PATH == "" ?
            env.BUILD_SERVICE_SR_PATH : "/default/ci/buildservice")
    
    def buildServiceUrl = "http://" + serviceRegistry + buildServiceServiceRegistryPath
    def buildServiceApiPath = "/jobs/${env.JOB_NAME}/builds/${env.BUILD_ID}/events" 
    def buildServiceEventUrl = buildServiceUrl + buildServiceApiPath
    
    def jsonEventPayload =
        "{ " +
            "\"event\": {" + 
                "\"type\": \"${type}\", " +
                "\"callback\": \"${eventCallbackUrl}\"" +
                (result ? ", \"result\": \"${result}\"" : "") +
            " } " +
        "}"
       
    // Send event payload to build service.
    // Don't fail the job if the event can't be sent 
    try
    {
        sh "curl -sS -X POST -H \"Content-Type: application/json\" -d '" +
            jsonEventPayload + "' " +  buildServiceEventUrl
        echo 'Sent build event "' + type + '" to Build Service URL: ' + buildServiceEventUrl         
    }
    catch (all)
    {
        echo 'Failed to send build event "' + type + '" to Build Service URL: ' + buildServiceEventUrl
    }
}
