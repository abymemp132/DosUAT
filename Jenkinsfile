pipeline {
    agent any

    /*
    triggers {
        // Triggers the pipeline daily at 8:00 AM (Disabled in favor of GitHub Actions)
        cron('0 8 * * *')
    }
    */

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
                script {
                    def hasEnvSecret = false
                    try {
                        withCredentials([string(credentialsId: 'ENV_FILE', variable: 'ENV_FILE_CONTENT')]) {
                            if (env.ENV_FILE_CONTENT && env.ENV_FILE_CONTENT.trim() != '') {
                                writeFile file: '.env', text: env.ENV_FILE_CONTENT
                                hasEnvSecret = true
                            }
                        }
                    } catch (Exception e) {
                        echo "Jenkins ENV_FILE credential not configured, using default workspace environment settings."
                    }

                    if (!hasEnvSecret) {
                        error "ENV_FILE Jenkins credential is required; no insecure fallback configuration is available."
                    }
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
            archiveArtifacts artifacts: 'playwright-report/**/*, reports/dashboard-static/**/*, reports/results.json', allowEmptyArchive: false, fingerprint: true

            // Publish the static HTML dashboard to view directly in Jenkins
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'reports/dashboard-static',
                reportFiles: 'index.html',
                reportName: 'Playwright Test Execution Dashboard'
            ])
        }
    }
}
