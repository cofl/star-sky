module.exports = function(env, callback){
    function splitPath(url){
        if(url[url.length-1] == '/'){ url = url.substr(0,url.length-1) }
        url = url.substring(0, url.lastIndexOf('/'))
        return url.length == 0 ? '/' : url
    }
    function leafPath(url){
        if(url[url.length-1] == '/'){ url = url.substr(0, url.length - 1) }
        return url.substring(url.lastIndexOf('/') + 1)
    }
    const normalizePath = (url) => env.config.baseUrl + url.replace(/\\/g, '/')
    const titleCase = (str) => str.replace(/\w\S*/g, (text) => text.charAt(0).toUpperCase() + text.slice(1))
    const template = env.config["directory-helper"].template
    const getDirectoryListingUrl = function(value){
        if('metadata' in value && value.metadata.template == template)
            return normalizePath(value.filename);
        else
            return null;
    }
    const excludeName = (name) => name.endsWith('.styl') || name == 'meta.json'
    const exclude = (name, it, mjson) => {
        if(name in mjson){
            var mit = mjson[name]
            if(mit['directory-exclude'])
                return true
        }
        if('filepath' in it){
            if('metadata' in it){
                if(it.metadata.template == template || it.metadata['directory-exclude'])
                    return true
            }
        }
        if('directory-exclude' in it)
            return true
        return false
    }

    env.helpers.directory = {
        listing: function(page){
            let number = 0
            function parse(dir, used_index){
                var listing = []
                var mjson = ('meta.json' in dir) ? dir['meta.json'].metadata : {}
                for(name in dir){
                    if(excludeName(name)) // leave out files we shouldn't list
                        continue
                    let value = dir[name]
                    if(exclude(name, value, mjson)) // leave out files we ask not to list
                        continue
                    let isFile = 'filepath' in value
                    let link, _name;
                    if(isFile){
                        if(name == 'index.md' && used_index)
                            continue; // skip index.md if it was used for the directory name
                        link = normalizePath(value.filename) || ''
                        _name = value.title
                    } else if('index.md' in value){
                        link = normalizePath(value['index.md'].filename) || ''
                        _name = value['index.md'].metadata.title
                        used_index = true
                    } else {
                        link = getDirectoryListingUrl(value) || ''
                        _name = name
                    }
                    if(name in mjson && 'title' in mjson[name]){
                        _name = mjson[name].title
                    }
                    link = link.replace(/\/index.html$/, '/') // strip "index.html" from the end of links
                    listing.push({
                        name: _name,
                        isFile,
                        link,
                        listing: (isFile ? null : parse(value, used_index)),
                        id: 'item' + (number++)
                    })
                }
                return listing.sort((a, b) => ((!a.isFile && b.isFile) || (a.name < b.name)) ? -1 : ((a.isFile && !b.isFile) || (a.name > b.name)) ? 1 : 0)
            }
            return parse(page.parent, false)
        },
        files: (directoryListing) => directoryListing.filter((it) => it.isFile),
        directories: (directoryListing) => directoryListing.filter((it) => !it.isFile),
        parentFolderName: (page) => ('metadata' in page && 'parent-name' in page.metadata) ? page.metadata['parent-name'] : titleCase(leafPath(splitPath(normalizePath(page.filename)))) || 'root',
        directoryListingUrl: function(page){
            if('metadata' in page && 'uplink' in page.metadata)
                return page.metadata.uplink;
            else
                return getDirectoryListingUrl(page.parent)
        }
    }
    env.helpers.titleCase = titleCase
    callback()
}
