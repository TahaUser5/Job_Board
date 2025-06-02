import subprocess
import re

def get_pylint_score(file_path):
    """Run pylint on a Python file and extract the score."""
    print(f"\nChecking {file_path}...")
    result = subprocess.run(
        ['pylint', file_path],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    print(result.stdout)  # Show full output from pylint

    # Extract score from pylint output
    match = re.search(r'Your code has been rated at ([\d\.]+)/10', result.stdout)
    if match:
        score = float(match.group(1))
        print(f"Pylint Score for {file_path}: {score}/10")
        return score
    else:
        print("Could not extract score.")
        return None

if __name__ == "__main__":
    file_to_check = "app.py"  # Change this if your file is somewhere else
    get_pylint_score(file_to_check)
