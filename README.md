# e-hentai-downloader

CLI multi-worker gallery downloader for e-hentai.org website.

![e-hentai-downloader](.docs/cli.jpg)

### Quick start

1. Clone this repo:
   ```shell
   git clone https://github.com/yuukari/e-hentai-downloader.git
   ```
2. Install dependencies:
   ```shell 
   npm i
   ```
3. View help (and make sure it's working):
   ```shell
   node index.js -h
   ```

### Known issues

- ⚠️ Usage of **high workers count** may cause high RPS to server, and temporary ban of your IP address by the website.

### Usage examples

1. Quick download:
    ```shell
    node index.js -l https://e-hentai.org/g/your-gallery
    ```
2. Download with specific workers count (more = faster)
    ```shell
    node index.js -l https://e-hentai.org/g/your-gallery -w 10
    ```
3. Download to specific location:
    ```shell
    node index.js -l https://e-hentai.org/g/your-gallery -o "C:\Images\Galleries"
    ```
4. Download to specific location with filename override (filenames starts from "img_1000.jpg"):
    ```shell
    node index.js \
      -l https://e-hentai.org/g/your-gallery \
      -o "C:\Images\Galleries" \
      -ft "img_*c*e" \
      -c 1000
    ```
   
### TO-DO

- [ ] Saving information about the download status and avoiding repeated downloads already existing pages - in case of failed downloads, interruption of the script, etc. 
- [ ] Adding proxy support