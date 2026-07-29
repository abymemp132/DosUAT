pipeline {
    agent any

    // Optional: If you use the Jenkins NodeJS plugin, you can automatically setup Node.js version here.
    // Uncomment the lines below and replace 'node' with your configured NodeJS tool name in Jenkins.
    /*
    tools {
        nodejs 'node'
    }
    */

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Create .env file') {
            steps {
                // Retrieves the ENV_FILE secret from Jenkins Credentials (as a Secret Text)
                // and writes it directly to the .env file in the workspace.
                withCredentials([string(credentialsId: 'ENV_FILE', variable: 'ENV_FILE_CONTENT')]) {
                    writeFile file: '.env', text: env.ENV_FILE_CONTENT
                }
            }
        }

        stage('Install dependencies') {
            steps {
                // Using platform-agnostic commands or executing appropriate shell for OS
                script {
                    if (isUnix()) {
                        sh 'npm ci'
                    } else {
                        bat 'npm ci'
                    }
                }
            }
        }

        stage('Run TypeScript check') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm run typecheck'
                    } else {
                        bat 'npm run typecheck'
                    }
                }
            }
        }

        stage('Run Lint') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npm run lint'
                    } else {
                        bat 'npm run lint'
                    }
                }
            }
        }

        stage('Install Playwright Browsers') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'npx playwright install chromium'
                    } else {
                        bat 'npx playwright install chromium'
                    }
                }
            }
        }

        stage('Run Combined Pipeline') {
            steps {
                // We use catchError so that test failures do not stop the pipeline,
                // allowing the dashboard/report to always be published.
                catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                    script {
                        if (isUnix()) {
                            sh 'npm run pipeline'
                        } else {
                            bat 'npm run pipeline'
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            // Archive the test reports and JSON results as build artifacts
            archiveArtifacts artifacts: 'playwright-report/**/*, reports/dashboard-static/**/*, reports/results.json', allowEmptyArchive: true, fingerprint: true

            // Publish the static HTML dashboard to view directly in Jenkins
            publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'reports/dashboard-static',
                reportFiles: 'index.html',
                reportName: 'Playwright Test Execution Dashboard'
            ])
        }
    }
}
