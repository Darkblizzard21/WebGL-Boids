import util.Vec2;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

public class ForceFieldGen {
    BufferedImage img;
    boolean generated = false;
    boolean blur = false;

    ForceFieldGen(File in) {
        try {
            img = ImageIO.read(in);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    void enableBlur(boolean value) {
        blur = value;
    }

    void enableBlur() {
        blur = true;
    }

    void gen() {
        if (generated) return;

        System.out.println("Started Image Generation");
        final long init = System.currentTimeMillis();;
        long start = init;

        for (int x = 0; x < img.getWidth(); x++) {
            for (int y = 0; y < img.getHeight(); y++) {
                Color current = new Color(img.getRGB(x, y));
                if (current.equals(Color.BLACK)) continue;

                Vec2[] empty = getNearestEmpty(x, y, 5);
                Vec2 pos = new Vec2(x, y);
                Vec2 dir = new Vec2(0, 0);
                for (Vec2 target : empty) {
                    dir = dir.add(pos.sub(target).through2Length());
                }
                img.setRGB(x, y, dir.toColor().getRGB());
            }
            System.out.println("Row " + x + " Completed");
        }

        long vectorGenTime = System.currentTimeMillis();
        System.out.println("Finished Vector Gen in " + (vectorGenTime- start) / 1000.0 + " Seconds.");
        start = System.currentTimeMillis();
        // Clear Empty
        Color neutral = new Color(127, 127, 255);
        for (int x = 0; x < img.getWidth(); x++) {
            for (int y = 0; y < img.getHeight(); y++) {
                Color current = new Color(img.getRGB(x, y));
                if (current.getBlue() < 50)
                    img.setRGB(x, y, neutral.getRGB());
            }
        }

        long clearETime = System.currentTimeMillis();
        System.out.println("Cleared Empty value in " + (clearETime - start) + " Millis.");
        start = System.currentTimeMillis();

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

        // Blur
        if (blur) {
            BufferedImage blurred = new BufferedImage(img.getWidth(), img.getHeight(), img.getType());

            for (int x = 0; x < img.getWidth(); x++) {
                for (int y = 0; y < img.getHeight(); y++) {
                    blurred.setRGB(x, y, blurredColor(x, y).getRGB());
                }
            }

            img = blurred;

            long blurTime = System.currentTimeMillis();
            System.out.println("Blurred Image in " + (blurTime - start) + " Millis.");
            start = System.currentTimeMillis();
        }

        long totalTime = System.currentTimeMillis();
        System.out.println("Generation finished in " + (totalTime-init) / 1000.0 + " Seconds.");
        generated = true;
    }

    void save(File out) {
        try {
            if (!out.exists() && !out.createNewFile())
                throw new IllegalStateException();
            ImageIO.write(img, "png", out);
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
    }

    private Vec2[] getNearestEmpty(int x, int y, int searchCount) {
        Vec2 pos = new Vec2(x, y);
        Vec2[] res = new Vec2[searchCount];
        Vec2 unreachable = new Vec2(img.getWidth() * 4, img.getHeight() * 4);
        for (int i = 0; i < searchCount; i++) {
            res[i] = unreachable;
        }
        for (int ix = 0; ix < img.getWidth(); ix++) {
            for (int iy = 0; iy < img.getHeight(); iy++) {
                Color current = new Color(img.getRGB(ix, iy));
                if (current.getBlue() < 50) {
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

    private Color blurredColor(int x, int y) {
        int r = 0, g = 0, b = 0, count = 0;

        for (int ix = Math.max(x - 1, 0); ix < Math.min(x + 2, img.getWidth()); ix++) {
            for (int iy = Math.max(y - 1, 0); iy < Math.min(y + 2, img.getHeight()); iy++) {
                Color color = new Color(img.getRGB(x, y));
                r += color.getRed();
                g += color.getGreen();
                b += color.getBlue();
                count++;
            }
        }
        return new Color(r / count, g / count, b / count);
    }
}