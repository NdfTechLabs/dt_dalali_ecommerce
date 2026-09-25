from urllib.parse import quote

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

from excel import load_excel


BATCH_SIZE = 20


def get_column_values(worksheet, column_name):
    """
    Return all non-empty values from the selected column.
    """

    # Find the column index
    headers = [cell.value for cell in worksheet[1]]

    column_index = headers.index(column_name) + 1

    values = []

    for row in worksheet.iter_rows(
        min_row=2,
        min_col=column_index,
        max_col=column_index,
        values_only=True
    ):
        value = row[0]

        if value is not None and str(value).strip():
            values.append(str(value).strip())

    return values


def open_chrome():
    options = Options()

    # Optional Chrome configuration
    options.add_argument("--start-maximized")

    driver = webdriver.Chrome(options=options)

    return driver


def search_images(driver, search_term):
    """
    Open Google Images for the given search term.
    """

    encoded_term = quote(search_term)

    url = f"https://www.google.com/search?tbm=isch&q={encoded_term}"

    driver.get(url)


def main():

    # --------------------------------
    # Load Excel and select column
    # --------------------------------

    workbook, worksheet, selected_column = load_excel()

    print(f"\nWorksheet: {worksheet.title}")
    print(f"Search column: {selected_column}")

    # --------------------------------
    # Extract search terms
    # --------------------------------

    search_terms = get_column_values(
        worksheet,
        selected_column
    )

    print(f"\nFound {len(search_terms)} search terms.")

    if not search_terms:
        print("No search terms found.")
        return

    # --------------------------------
    # Open Chrome
    # --------------------------------

    driver = open_chrome()

    try:

        # --------------------------------
        # Process in batches
        # --------------------------------

        for batch_start in range(57, len(search_terms), BATCH_SIZE):

            batch = search_terms[
                batch_start:batch_start + BATCH_SIZE
            ]

            print("\n" + "=" * 60)
            print(
                f"Batch: {batch_start // BATCH_SIZE + 1}"
            )
            print(
                f"Current index: {batch_start}"
            )
            print(
                f"Processing items: "
                f"{batch_start + 1} - "
                f"{batch_start + len(batch)}"
            )
            print("=" * 60)

            for index, search_term in enumerate(
                batch,
                start=batch_start
            ):

                print(
                    f"\n[{index}] Searching: {search_term}"
                )

                search_images(
                    driver,
                    search_term
                )

                input(
                    "Press ENTER to continue to the next item..."
                )

            # --------------------------------
            # Batch finished
            # --------------------------------

            next_index = batch_start + BATCH_SIZE

            if next_index < len(search_terms):

                print(
                    f"\nBatch complete."
                    f"\nCurrent index: {next_index}"
                )

                input(
                    "Press ENTER to start the next batch..."
                )

    finally:
        driver.quit()


if __name__ == "__main__":
    main()