function testStretch()
{
    var stretchy = new StretchyLayout({
        size: [300, 300],
        position: [0, 0, 0],
        viewAlign: [0.5, 0.5]
    });
    stretchy.setPosition([-100, -100, 0]);
    stretchy.setAlign([0.5, 0.5]);
    stretchy.setOrigin([0.5, 0.5]);

    var factory = new ObjectFactory();

    function makepv(text) {
        var pv = new PositionableView();
        pv.surface = factory.makeSurface(text);
        pv.add(pv.surface);

        pv.surface.on('click', function () {
            if (pv._stretchConfig.weight == 1)
                pv._stretchConfig.weight = 2;
            else
                pv._stretchConfig.weight = 1;

            stretchy.reflow([300, 200]);
        });
        return pv;
    }

    var pv1 = makepv("PV1");
    var pv2 = makepv("PV2");
    var pv3 = makepv("PV3");

    stretchy.addChild(pv1, {weight: 1, targetSize: [200, 120], minSize: [200, 20]});
    stretchy.addChild(pv2, {weight: 2, targetSize: [200, 250], minSize: [200, 20]});
    stretchy.addChild(pv3, {weight: 1, targetSize: [200, 130], minSize: [200, 20]});

    rootNode.add(stretchy.getModifier()).add(stretchy);
    var s = stretchy.measure([300,200]);
    stretchy.layout(s.minimumSize);
}