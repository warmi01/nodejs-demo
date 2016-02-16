node {

   checkout scm

   //docker.withRegistry('https://docker.example.com/', 'docker-registry-login') {
   
      try
      {
        def version = readFile 'src/version.txt' 
        def imagetag = "${version.trim()}.${env.BUILD_ID}"
        def app_image, app_unit_image, app_int_image, app_container, unit_container_id, int_container_id
   
        stage 'build'
        def images = buildImages(imagetag)
        app_image = images[0]
        app_unit_image = images[1]
        app_int_image = images[2]
        
        // Run demo app
        echo 'Running demo app..'
        app_container = app_image.run("-i --name nodejs-demo-${imagetag}")
   
        stage 'unit tests'
        unit_container_id = runAttached(app_unit_image, "-i --name nodejs-demo-unit-tests-${imagetag}")
        testResults(unit_container_id, 'Unit')

        stage 'integration tests'
        int_container_id = runAttached(app_int_image, "-i --link nodejs-demo-${imagetag}:demohost --name nodejs-demo-int-tests-${imagetag}")
        testResults(int_container_id, 'Integration')
      }
      catch (all)
      {
        error 'Pipeline error'
      }
      finally
      {
         cleanup()
      }    
   //}
}

def buildImages(imagetag) {

   // Build demo app image first (used as test image base)
   app_image = docker.build("nodejs-demo",'src/demo-app')
   
   parallel "Building Docker unit tests image":
   {
      app_unit_image = docker.build("nodejs-demo-unit-tests:${imagetag}",'src/demo-app-unit-tests')
   },
   "Building Docker integration tests image":
   {
      app_int_image = docker.build("nodejs-demo-int-tests:${imagetag}",'src/demo-app-int-tests')
   },
   failFast: false
  
   // Now tag demo app image (after test images built on 'latest' base)
   app_image.tag("${imagetag}");

   echo 'Docker builds for images successful'
   
   return [app_image, app_unit_image, app_int_image]
}

def runAttached(image, args) {

   docker.node {
   
      try {
        docker.script.sh "rm .container"
      }
      catch (all) 
      {} 
      docker.script.sh "docker run --cidfile=.container ${args != '' ? ' ' + args : ''} ${image.id}"
      def container = docker.script.readFile('.container').trim()
      docker.script.dockerFingerprintRun containerId: container, toolName: docker.script.env.DOCKER_TOOL_NAME
      return container
   }
}

def testResults(container, stage) {

  docker.script.sh "docker logs ${container} > result.txt 2>&1"
  def result = readFile('result.txt')
  if (result.trim().contains('npm info ok'))
  {
      echo "${stage} tests passed."
  }
  else
  {
      error "${stage} tests failed"
  }
}

def cleanup() {

  parallel "Stop demo app container":
  {
   try
   {
      app_container.stop()
   }
   catch (all) {}
  },
  "Stop unit tests container":
  {
   try
   {
      docker.script.sh "docker stop ${unit_container_id} && docker rm -f ${unit_container_id}"
   }
   catch (all) {}
  },
  "Stop integration tests container":
  {
   try
   {
      docker.script.sh "docker stop ${int_container_id} && docker rm -f ${int_container_id}"
   }
   catch (all) {}
  },
  failFast: false

}
