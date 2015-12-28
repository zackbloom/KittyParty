(function() {
  var TIME_LIMIT, checkNode, guessDimentions, observer, optimizeSrc, selector;

  guessDimentions = function(el) {
    var computed, height, width;
    computed = getComputedStyle(el);
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
    var proto, size;
    if (!src)
      src = el.src

    if (/lorempixel[._]com/.test(src)) {
      return;
    }
    size = guessDimentions(el);

    if (!size.width || !size.height) {
      return;
    }

    proto = document.location.protocol;
    if (proto === 'file:') {
      proto = 'http:';
    }

    var num = Math.floor(Math.random() * 10) + 1;

    return "" + proto + "//h_lorempixel_com.p.eager.works/g/" + (size.width || '600') + "/" + (size.height || '400') + "/cats/" + num + "/";
  };

  backgroundRe = /url\(["']?(.+?)["']?\)/;

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
    var optimizedSrc, origSrc;

    switch (addedNode.nodeType) {
      case 1:
        if (addedNode.tagName == 'IMG') {
          optimizedSrc = optimizeSrc(addedNode);

          if (optimizedSrc !== origSrc) {
            setSrc(addedNode, optimizedSrc);
          }

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
      var addedNode, mutation, _i, _len;
      for (_i = 0, _len = mutations.length; _i < _len; _i++) {
        mutation = mutations[_i];

        var _j, _len1, _ref;
        _ref = mutation.addedNodes;

        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          walkChildren(_ref[_j]);
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

}).call(this);
