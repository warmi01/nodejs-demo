node {
     // Run the pipeline job
     
     sendBuildEvent("JOB_STARTED", null, null)
     try
     {  
          runPipeline()         
          sendBuildEvent("JOB_ENDED", "SUCCESS", null)
     }
     // Handle aborting a job
     catch (hudson.AbortException e)
     {
          sendBuildEvent("JOB_ENDED", "ABORTED", null)
     }
     catch (all)
     {
          sendBuildEvent("JOB_ENDED", "FAILED", null)
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
               def version = docker.script.readFile('src/version.txt').trim() 
               def imagetag = "${version}.${env.BUILD_ID}"
               
               stage 'build docker images'
               buildImages(images, imagetag)
               
               stage 'run integration tests'
               runIntegrationTests(images, imagetag, containers)
               
               stage 'publish docker images'
               publishDockerImages(images, imagetag)
          }
          catch (hudson.AbortException e)
          {
              // Need to rethrow exception
              throw e
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

def buildImages(images, imagetag) {

     sendBuildEvent("BUILD_STARTED", null, null)
     
     try
     {
          // Build demo app image first (latest used as test image base)
          images.app = docker.build("${env.JOB_NAME}",'src/demo-app')
          images.app.tag("${imagetag}")
          images.app = docker.image("${env.JOB_NAME}:${imagetag}")
            
          images.app_tests = docker.build("${env.JOB_NAME}-tests:${imagetag}",'src/demo-app-tests')

          echo 'Docker builds for images successful'         
          sendBuildEvent("BUILD_ENDED", "SUCCESS", null)
     }
     // Handle aborting a job
     catch (hudson.AbortException e)
     {
         sendBuildEvent("BUILD_ENDED", "ABORTED", null)
         // Need to rethrow exception
         throw e
     }
     catch (all)
     {
          sendBuildEvent("BUILD_ENDED", "FAILED", null)
          error 'Build Images failed'
     }     
}

def runIntegrationTests(images, imagetag, containers) {
    
     sendBuildEvent("TEST_STARTED", null, null)
                    
     try
     {
         // Run demo app
         echo 'Running demo app..'
         containers.app = images.app.run("-i --name ${env.JOB_NAME}-${imagetag}")
            
         containers.app_tests = runAttached(images.app_tests, "-i --link ${env.JOB_NAME}-${imagetag}:demohost --name ${env.JOB_NAME}-tests-${imagetag}", 'npm run-script int-test')
         testResults(containers.app_tests)
                    
         sendBuildEvent("TEST_ENDED", "SUCCESS", null)
     }
     // Handle aborting a job
     catch (hudson.AbortException e)
     {
         sendBuildEvent("TEST_ENDED", "ABORTED", null)
         // Need to rethrow exception
         throw e
     }
     catch (all)
     {
         sendBuildEvent("TEST_ENDED", "FAILED", null)
         error 'Integration tests failed'
     }
}

def runAttached(image, args, command) {

     docker.node {
     
          try {
               docker.script.sh "rm .container"
          }
          catch (hudson.AbortException e)
          {
              // Need to rethrow exception
              throw e
          }
          catch (all)
          {    
          } 
          
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

     sendBuildEvent("PUBLISH_STARTED", null, null)
     
     try {
          def appUrl
          def testUrl
          
          // temporariy use fully qualified VDR name; shorter ose3vdr1 should be used once devops docker changes made
          //docker.withRegistry('http://ose3vdr1.services.slogvpc1.caplatformdev.com:5000', 'docker-registry-login') {
          docker.withRegistry('http://ose3vdr1:5000', 'docker-registry-login') {
               
               images.app.push(imagetag)
               images.app_tests.push(imagetag)
               
               appUrl = images.app.imageName()
               testUrl = images.app_tests.imageName()
          }
          
          def detailsParm = [appUrl.toString(), testUrl.toString()]
          sendBuildEvent("PUBLISH_ENDED", "SUCCESS", detailsParm)
     }
     // Handle aborting a job
     catch (hudson.AbortException e)
     {
         sendBuildEvent("PUBLISH_ENDED", "ABORTED", null)
         // Need to rethrow exception
         throw e
     }
     catch (all)
     {
          sendBuildEvent("PUBLISH_ENDED", "FAILED", null)
          echo 'Failed to tag/push to VDR image'
          error 'Failed to tag/push to VDR image'
     }
}

/**
 * Sends a build event to the build service.
 * @param type Stage event type
 * @param result Result for the stage.  Required for ENDED event types
 * @param details (Optional) Event details for certain types:
 * PUBLISH_ENDED - Pass a list containing image repository URLs
 */
def sendBuildEvent(type, result, details)
{
    // Use the Platform Service Registry to communicate with the Build Service.
    // TODO: Remove fallback after testing with deployed Build Service app package
 
    // Get the event callback URL from the Jenkins job parameter.
    // Test existence of the parameter by trying to access it.
    def eventCallbackUrl
    try
    {
        eventCallbackUrl = CI_EVENT_CALLBACK
        if (eventCallbackUrl.isEmpty())
        {
            throw new Exception()
        }
    }
    catch (hudson.AbortException e)
    {
        // Need to rethrow exception
        throw e
    }
    catch (all)
    {
        echo 'Not sending build event since callback URL is not set'
        return    
    }
    
    def jsonDetails
    if (details &&
        type == "PUBLISH_ENDED")
    {
        def firstIteration = true
        
        // Build JSON image repository URL details from the details image list
        jsonDetails = "{ \"images\": ["
        for (imageUrl in details)
        {
            if (firstIteration == false)
            {
                jsonDetails += ","
            }
            jsonDetails += "\"${imageUrl}\""
            firstIteration = false
        }
        jsonDetails += "] }"
    }
    
    // Create the URL for the Build Service Event REST API
    def serviceRegistry = env.SERVICE_REGISTRY_HOSTNAME
    def buildServiceServiceRegistryPath = (env.BUILD_SERVICE_SR_PATH ?
        env.BUILD_SERVICE_SR_PATH : "/default/ci/buildservice")
    def buildServiceHost = env.BUILD_SERVICE_SERVICE_HOST
    def buildServicePort = env.BUILD_SERVICE_SERVICE_PORT
    
    def buildServiceUrl = (serviceRegistry ?
        "http://" + serviceRegistry + buildServiceServiceRegistryPath :
        "http://" + buildServiceHost + ":" + buildServicePort)
    def buildServiceApiPath = "/jobs/${env.JOB_NAME}/builds/${env.BUILD_ID}/events" 
    def buildServiceEventUrl = buildServiceUrl + buildServiceApiPath
    
    def jsonEventPayload =
        "{ " +
            "\"event\": {" + 
                "\"type\": \"${type}\", " +
                "\"callback\": \"${eventCallbackUrl}\"" +
                (result ? ", \"result\": \"${result}\"" : "") +
                (jsonDetails ? ", \"details\": ${jsonDetails}" : "") +
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
    catch (hudson.AbortException e)
    {
        // Need to rethrow exception
        throw e
    }
    catch (all)
    {
        echo 'Failed to send build event "' + type + '" to Build Service URL: ' + buildServiceEventUrl
    }
}
