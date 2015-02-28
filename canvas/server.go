package main

import (
	"github.com/elazarl/go-bindata-assetfs"
	"github.com/garious/yoink/jsappserver"
	"github.com/garious/yoink/stdlib"
	"log"
	"net/http"
)

func main() {
	fs := &assetfs.AssetFS{Asset: stdlib.Asset, AssetDir: stdlib.AssetDir}
	http.Handle("/stdlib/", http.StripPrefix("/stdlib/", http.FileServer(fs)))

	jsappserver.HandleDir("/", ".")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
