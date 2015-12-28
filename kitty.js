(function() {
  var guessDimentions = function(el) {
    var computed = getComputedStyle(el);

    var height, width;
    if (el.height) {
      height = parseFloat(el.height);
    } else if (el.style.height) {
      height = parseFloat(el.style.height);
    } else if (computed.height) {
      height = parseFloat(computed.height);
    }

    if (el.width) {
      width = parseFloat(el.width);
    } else if (el.style.width) {
      width = parseFloat(el.style.width);
    } else if (computed.width) {
      width = parseFloat(computed.width);
    }

    return {
      height: height,
      width: width
    };
  };

  optimizeSrc = function(el, src) {
    if (!src)
      src = el.src

    if (/lorempixel[._]com/.test(src)) {
      return;
    }
    var size = guessDimentions(el);

    if (!size.width || !size.height) {
      return;
    }

    var proto = document.location.protocol;
    if (proto === 'file:') {
      proto = 'http:';
    }

    var num = Math.floor(Math.random() * 10) + 1;

    return "" + proto + "//h_lorempixel_com.p.eager.works/g/" + (size.width || '600') + "/" + (size.height || '400') + "/cats/" + num + "/";
  };

  var backgroundRe = /url\(["']?(.+?)["']?\)/;

  var checkBackground = function(addedNode) {
    var style = getComputedStyle(addedNode)

    if (style.backgroundImage && style.backgroundImage !== 'none'){
      var match = backgroundRe.exec(style.backgroundImage);

      if (match){
        var optimizedSrc = optimizeSrc(addedNode, match[1]);

        if (optimizedSrc && optimizedSrc !== match[1]) {
          addedNode.style.backgroundImage = 'url("' + optimizedSrc + '")'
        }
      }
    }
  }

  checkNode = function(addedNode) {
    switch (addedNode.nodeType) {
      case 1:
        if (addedNode.tagName == 'IMG') {
          setSrc(addedNode, optimizeSrc(addedNode));

          watch(addedNode, 'src', function(node){
            setSrc(node, optimizeSrc(node));
          });
        } else {
          checkBackground(addedNode);
          watch(addedNode, 'style', checkBackground);
        }
    }
  };

  var setSrc = function(img, src){
    if (!src || src === img.src)
      return;

    img.src = src;
    img.style.visibility = 'hidden';

    var done = function(){
      img.style.visibility = 'visible';

      img.removeEventListener('load', done);
      img.removeEventListener('error', done);
    }

    img.addEventListener('load', done);
    img.addEventListener('error', done);
  }

  var watch = function(node, attr, cb){
    var updating = false;
    var ob = new MutationObserver(function(mutations) {
      if (updating)
        return;

      for (var i=0; i < mutations.length; i++) {
        var mutation = mutations[i];

        if (mutation.attributeName === attr){
          updating = true;
          setTimeout(function(){
            updating = false;
          }, 0);

          cb(node)
        }
      }
    });

    ob.observe(node, {
      attributes: true,
      attributeFilter: [attr]
    });
  }

  var walkChildren = function(node) {
    if (node.nodeType === 1){
      checkNode(node);

      if (node.children.length){
        for (var i=0; i < node.children.length; i++){
          walkChildren(node.children[i]);
        }
      }
    }
  }

  if (window.MutationObserver != null) {
    observer = new MutationObserver(function(mutations) {
      for (var i=0; i < mutations.length; i++) {
        mutation = mutations[i];

        for (var j=0; j < mutation.addedNodes.length; j++) {
          walkChildren(mutation.addedNodes[j]);
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

})();
