import util.ColorToBooleanFunc;
import util.Vec2;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

public class ForceFieldGen {
    BufferedImage original;
    BufferedImage render;
    boolean generated = false;
    boolean useDegrees = false;
    float degrees = 90.0f;

    ForceFieldGen(File in) {
        try {
            original = ImageIO.read(in);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    void enableCircularLila(){
        useDegrees = true;
    }
    void setRotation(float deg){
        degrees = deg;
    }

    void gen() {
        if (generated) return;

        System.out.println("Started Image Generation");
        final long init = System.currentTimeMillis();
        long start = init;
        ColorToBooleanFunc hitBlack = (c) -> c.getBlue() == 0;
        ColorToBooleanFunc hitOther = (c) -> c.getBlue() > 0;
        BufferedImage img = new BufferedImage(original.getWidth(),original.getHeight(), original.getType());
        for (int x = 0; x < original.getWidth(); x++) {
            for (int y = 0; y < original.getHeight(); y++) {
                Color current = new Color(original.getRGB(x, y));
                boolean rotate = true;
                ColorToBooleanFunc search = hitBlack;
                if (current.getBlue() == 0) {
                    rotate = false;
                    search = hitOther;
                }
                else if(!useDegrees) continue;

                Vec2[] empty = getNearestEmpty(x, y, 5, search, original);
                Vec2 pos = new Vec2(x, y);
                Vec2 dir = new Vec2(0, 0);
                for (Vec2 target : empty) {
                    dir = dir.add(target.sub(pos).through2Length());
                }
                if(rotate)
                    dir = dir.rotated(degrees);
                img.setRGB(x, y, dir.toColor().getRGB());
            }
            System.out.println("Row " + x + " Completed");
        }

        render = img;
        String outPath = ".\\mediaOut\\0.png";
        save(new File(outPath));
        long vectorGenTime = System.currentTimeMillis();
        System.out.println("Finished Vector Gen in " + (vectorGenTime- start) / 1000.0 + " Seconds.");
        start = System.currentTimeMillis();
        // Clear Empty
        Color neutral = new Color(127, 127, 255);
        for (int x = 0; x < img.getWidth(); x++) {
            for (int y = 0; y < img.getHeight(); y++) {
                Color current = new Color(img.getRGB(x, y));
                if (current.getBlue() == 0)
                    img.setRGB(x, y, neutral.getRGB());
            }
        }

        long clearETime = System.currentTimeMillis();
        System.out.println("Cleared Empty value in " + (clearETime - start) + " Millis.");
        start = System.currentTimeMillis();


        outPath = ".\\mediaOut\\1.png";
        save(new File(outPath));
        // Clear Blue
        for (int x = 0; x < img.getWidth(); x++) {
            for (int y = 0; y < img.getHeight(); y++) {
                Color current = new Color(img.getRGB(x, y));
                Color next = new Color(current.getRed(), current.getGreen(), 0);
                img.setRGB(x, y, next.getRGB());
            }
        }
        long clearBTime = System.currentTimeMillis();
        System.out.println("Cleared Blue value in " + (clearBTime - start) + " Millis.");
        start = System.currentTimeMillis();


        long totalTime = System.currentTimeMillis();
        System.out.println("Generation finished in " + (totalTime-init) / 1000.0 + " Seconds.");

        render = img;
        generated = true;
    }

    void save(File out) {
        try {
            if (!out.exists() && !out.createNewFile())
                throw new IllegalStateException();
            ImageIO.write(render, "png", out);
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
    }

    private Vec2[] getNearestEmpty(int x, int y, int searchCount, ColorToBooleanFunc func, BufferedImage img) {
        Vec2 pos = new Vec2(x, y);
        Vec2[] res = new Vec2[searchCount];
        Vec2 unreachable = new Vec2(img.getWidth() * 4, img.getHeight() * 4);
        for (int i = 0; i < searchCount; i++) {
            res[i] = unreachable;
        }
        for (int ix = 0; ix < img.getWidth(); ix++) {
            for (int iy = 0; iy < img.getHeight(); iy++) {
                Color current = new Color(img.getRGB(ix, iy));
                if (func.op(current)) {
                    Vec2 newContender = new Vec2(ix, iy);
                    for (int i = 0; i < searchCount; i++) {
                        if (res[i].distanceTo(pos) > newContender.distanceTo(pos)) {
                            for (int j = searchCount - 1; j > i; j--) {
                                res[j] = res[j - 1];
                            }
                            res[i] = newContender;
                            break;
                        }
                    }
                }
            }
        }

        return res;
    }
}