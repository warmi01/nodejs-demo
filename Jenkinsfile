node {

   checkout scm

   docker.withRegistry('https://docker.example.com/', 'docker-registry-login') {
   
      try
      {
        def version = readFile 'src/version.txt' 
        def imagetag = "${version.trim()}.${env.BUILD_ID}"
   
        stage 'build'
        parallel "Building Docker demo app image":
        {
            def app_image = docker.build("nodejs-demo:${imagetag}",'src/demo-app')
        },
        "Building Docker unit tests image":
        {
               app_unit_image = docker.build("nodejs-demo-unit-tests:${imagetag}",'src/demo-app-unit-tests')
        },
        "Building Docker integration tests image":
        {
         app_int_image = docker.build("nodejs-demo-int-tests:${imagetag}",'src/demo-app-int-tests')
        },
        failFast: false
       
        def app_container = app_image.run("-i --name nodejs-demo-${imagetag}")
   
        stage 'unit tests'
        def unit_container_id = runAttached(app_unit_image, "-i --name nodejs-demo-unit-tests-${imagetag}")
        docker.script.sh "docker logs ${unit_container_id} > result.txt 2>&1"
        def unit_results = readFile('result.txt')
        if (unit_results.trim().contains('npm info ok'))
        {
            echo 'Unit tests passed.'
        }
        else
        {
            error 'Unit tests stage failed'
        }
   
        stage 'integration tests'
        def int_container_id = runAttached(app_int_image, "-i --link nodejs-demo-${imagetag}:demohost --name nodejs-demo-int-tests-${imagetag}")
        docker.script.sh "docker logs ${int_container_id} > result.txt 2>&1"
        def int_results = readFile('result.txt')
        if (int_results.trim().contains('npm info ok'))
        {
            echo 'Integration tests passed.'
        }
        else
        {
            error 'Integration tests stage failed'
        }
      }
      catch (all)
      {
        error 'Pipeline error'
      }
      finally
      {
        parallel "Stop demo app container":
        {
         try
         {
            app_container.stop()
         }
         catch (all)
         {    
         }
        },
        "Stop unit tests container":
        {
         try
         {
            docker.script.sh "docker stop ${unit_container_id} && docker rm -f ${unit_container_id}"
         }
         catch (all)
         {
         }
        },
        "Stop integration tests container":
        {
         try
         {
            docker.script.sh "docker stop ${int_container_id} && docker rm -f ${int_container_id}"
         }
         catch (all)
         {
         }
        },
        failFast: false
      }    
   }
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

