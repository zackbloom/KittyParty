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

  var currentCat = 0;

  optimizeSrc = function(el, src) {
    if (!src)
      src = el.src

    if (/meow-voyage[._]imgix[._]net/.test(src)) {
      return;
    }
    var size = guessDimentions(el);

    if (!size.width)
      size.width = 400
    if (!size.height)
      size.height = 400

    if (size.width < 20 || size.height < 20)
      return;

    var aspectRatio = size.width / size.height;
    if (aspectRatio > 8 || aspectRatio < 0.125)
      return;

    size.width |= 0;
    size.height |= 0;

    size.width = Math.min(size.width, 1600);
    size.height = Math.min(size.height, 1600);

    var proto = document.location.protocol;
    if (proto === 'file:') {
      proto = 'http:';
    }

    currentCat++;
    var num = currentCat;
    currentCat = currentCat % 15;

    return "//meow-voyage.imgix.net/" + num + ".jpg?w=" + size.width + "&h=" + size.height + "&fit=min&auto=enhance,format";
  };

  var backgroundRe = /url\(["']?(.+?)["']?\)/;

  var checkBackground = function(addedNode) {
    var style = getComputedStyle(addedNode)

    if (style.backgroundImage && style.backgroundImage !== 'none' && style.backgroundImage.indexOf('meow-voyage') === -1 && addedNode !== document.body){
      var match = backgroundRe.exec(style.backgroundImage);

      if (match){
        var optimizedSrc = optimizeSrc(addedNode, match[1]);

        if (optimizedSrc && optimizedSrc !== match[1]) {
          addedNode.style.backgroundImage = addedNode.style.backgroundImage.replace(backgroundRe, 'url("' + optimizedSrc + '")')
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
    if (!src || src === img.src || img.src.indexOf('meow-voyage') !== -1)
      return;

    img.src = src;
    img.srcset = '';

    if (!img.getAttribute('onload') || img.getAttribute('onload').indexOf('google') === -1){
      // ^ Fix for Google Images
      img.style.visibility = 'hidden';
    }

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
