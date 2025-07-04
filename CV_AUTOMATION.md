# Automated CV Download System

This repository includes an automated system to download and update the CV from OSF (Open Science Framework).

## How it works

The GitHub Actions workflow `.github/workflows/update-cv.yml` automatically:

1. **Runs daily at 2:00 AM UTC** (can also be triggered manually)
2. **Downloads the latest CV** from https://osf.io/download/84ktq
3. **Validates** the downloaded file is a valid PDF
4. **Saves** it as `static/cv-pablo-bernabeu.pdf`
5. **Checks for changes** and only commits if the file has been updated
6. **Commits and pushes** the updated CV if changes are detected

## Manual triggering

The workflow can be manually triggered from the GitHub Actions tab in the repository by clicking "Run workflow" on the "Update CV from OSF" workflow.

## CV Access

The CV is accessible at:
- Direct link: `/static/cv-pablo-bernabeu.pdf`
- Via redirect: `/cv/` (which redirects to the static file)

## Troubleshooting

If the workflow fails:
1. Check the Actions tab for error details
2. Verify the OSF link is still accessible
3. Ensure the downloaded file is a valid PDF
4. Check repository permissions for the GitHub Actions bot