import requests
from bs4 import BeautifulSoup
import os

# Define the directory to save house plans
output_dir = "house_plans"
os.makedirs(output_dir, exist_ok=True)

# List of websites to scrape (modify as needed)
websites = [
    "https://eplan.house/en/house-plans/besplatnye-proekty-domov",
    "https://www.truoba.com/free-modern-house-plans/",
    "https://houseplansdirect.co.uk/product/free-download-house-plans-sample/"
]

for site in websites:
    try:
        response = requests.get(site, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")

            # Extract links to downloadable PDFs (Modify based on site structure)
            links = soup.find_all("a", href=True)
            for link in links:
                if ".pdf" in link["href"]:  # Looking for PDF links
                    file_url = link["href"]
                    file_name = os.path.join(output_dir, file_url.split("/")[-1])

                    with open(file_name, "wb") as f:
                        f.write(requests.get(file_url).content)
                    print(f"Downloaded: {file_name}")
    except Exception as e:
        print(f"Error scraping {site}: {e}")

print("Scraping complete.")
