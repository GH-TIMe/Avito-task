(async function IIFE() {

    class listOfRepos {
        constructor() {
            this.repositories = document.getElementById("repositories");
            this.paginator = document.getElementById("paginator");
            this.searchLine = document.getElementById("search__line");
            this.loader = document.querySelector(".loader");
            this.deletePaginator = true;
            this.firstLoad = true;
            this.pageNum = (!isNaN(localStorage.paginator)) ? +localStorage.paginator : 1;
        }

        async request(url) {
            return (await (await fetch(url)).json());
        }

        checkEmptySearch() {
            return (this.searchLine.value.trim() === "") ? true : false;
        }

        clear() {
            this.repositories.innerHTML = '';
            if (this.deletePaginator) {
                this.paginator.innerHTML = '';
            }
        }

        getSearchURL() {
            const url = "https://api.github.com/search/repositories";

            if (this.firstLoad && localStorage.searchRequest) {
                this.searchLine.value = localStorage.searchValue;
                this.firstLoad = false;
                return url + localStorage.searchRequest;
            }

            localStorage.searchValue = this.searchLine.value.trim();
            this.firstLoad = false;

            // save search request
            if (this.checkEmptySearch()) {
                localStorage.searchRequest = "?q=stars:>100&sort=stars&order=desc&per_page=50"
            } else {
                localStorage.searchRequest = "?q=" + localStorage.searchValue + "+in:name&per_page=50";
            }

            return url + localStorage.searchRequest;
        }

        async getRepos() {
            this.clear();
            this.loader.classList.add( "active" );
            this.repos = Array.from( ( await this.request( this.getSearchURL() ) ).items );
            this.loader.classList.remove( "active" );
        }

        showRepos() {
            this.repositories.innerHTML += this.makeRepos();
            if (this.deletePaginator) {
                this.createPaginator();
                this.deletePaginator = false;
            }
        }

        makeRepos() {
            if (this.repos.length === 0) {
                return '<li class="repo__empty">not found</li>';
            }

            let i = (this.pageNum - 1) * 10,
                rows = '';
            const title = `
                <li class="repo">
                    <h2 class="repo__header">Title</h2>
                    <h2 class="repo__header">Stars</h2>
                    <h2 class="repo__header">Date</h2>
                    <h2 class="repo__header">Repo link</h2>
                </li>
            `;
            while (this.repos[i] && i < this.pageNum * 10) {
                const repo = this.repos[i];
                const repoPushedAt = repo.pushed_at.slice(0, repo.pushed_at.indexOf("T"));
                rows += `
                    <li class="repo">
                        <h3 class="repo__title long"><a class="link" href="./card/index.html?repo=https://api.github.com/repos/${repo.full_name}">${repo.name}</a></h3>
                        <a class="stars long" href="https://github.com/${repo.full_name}/stargazers" target="_blank">
                            <svg class="stars__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14.82" height="14.16">
                                <use xlink:href="#stars">
                            </svg>
                            <span class="stars__count">${repo.stargazers_count}<span>
                        </a>
                        <a class="repo__commit-date long" href="https://github.com/${repo.full_name}/commit/master"><time datetime="${repoPushedAt}">${repoPushedAt}</time></a>
                        <a class="repo__url link long" href="${repo.html_url}">${repo.html_url}</a>
                    </li>
                `;
                i++;
            }
            return title + rows;
        }

        createPaginator() {
            localStorage.paginator = this.pageNum;
            const numOfPages = Math.floor((this.repos.length - 1) / 10) + 1;
            
            if (numOfPages < 2) {
                return;
            }

            let pages = '';

            for (let num = 1; num <= numOfPages; num++) {
                const classes = (num === this.pageNum) ? 'paginator__item active' : 'paginator__item';
                pages += `<li class="${classes}">${num}</li>`;
            }
            this.paginator.innerHTML += pages;
        }
    }

    const search = document.getElementById("search");
    const reposList = new listOfRepos();

    
    await reposList.getRepos();
    reposList.showRepos();

    search.addEventListener("submit", async function searchReposByName(event) {
        event.preventDefault();
        reposList.searchLine.blur();
        reposList.deletePaginator = true;
        reposList.pageNum = 1;
        
        await reposList.getRepos();
        reposList.showRepos();
    });

    reposList.paginator.addEventListener("click", function switchPage(event) {
        const element = event.target;
        if (element.tagName === "LI") {

            const pageNum = +element.innerHTML;
            if (pageNum === reposList.pageNum) {
                return;
            }

            const pages = Array.from(document.querySelectorAll(".paginator__item"));
            pages.forEach(page => {
                page.classList.remove("active");
            });
            element.classList.add("active");

            // save page num
            localStorage.paginator = pageNum;
            reposList.pageNum = pageNum;

            reposList.clear();
            reposList.showRepos();
        }
    });

})();
