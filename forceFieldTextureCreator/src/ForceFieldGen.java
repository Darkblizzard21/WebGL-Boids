import util.ColorToBooleanFunc;
import util.MMath;
import util.Vec2;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.image.BufferedImageOp;
import java.awt.image.ConvolveOp;
import java.awt.image.Kernel;
import java.io.File;
import java.io.IOException;
import java.util.Optional;

public class ForceFieldGen {
    BufferedImage original;
    BufferedImage render;
    boolean generated = false;
    boolean useBlur = false;
    boolean invertBlueRotation =false;
    float selfWeight = 1;
    public float rotation = 90.0f;
    float degrees = 90.0f;
    double maxLengthDivisor = 4.0;

    ForceFieldGen(File in) {
        try {
            original = ImageIO.read(in);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    static ForceCalculationType GetType(Color c) {
        if (c.getBlue() > 0) {
            return ForceCalculationType.NEAREST_ROTATED;
        }
        if (c.getRed() > 0) {
            return ForceCalculationType.NEAREST_OUTER_ROTATED;
        }
        return ForceCalculationType.NEAREST;
    }

    void invertBlueRotation(){
        invertBlueRotation = true;
    }

    void enableBlur() {
        useBlur = true;
    }

    void setBlurCenterWeight(int weight) {
        if (weight < 1)
            throw new IllegalArgumentException();
        selfWeight = weight;
    }

    void gen() {
        if (generated) return;

        System.out.println("Started Image Generation");
        final long init = System.currentTimeMillis();
        long start = init;
        ColorToBooleanFunc hitBlack = (c) -> c.equals(Color.BLACK);
        ColorToBooleanFunc hitColor = (c) -> !c.equals(Color.BLACK);

        int quadSize = Math.min(original.getWidth(), original.getHeight());
        double maxEncodedLength = ((double) quadSize) / maxLengthDivisor;

        BufferedImage img = new BufferedImage(original.getWidth(), original.getHeight(), original.getType());
        for (int x = 0; x < original.getWidth(); x++) {
            for (int y = 0; y < original.getHeight(); y++) {
                Color current = new Color(original.getRGB(x, y));

                Vec2 nearest;
                boolean rotate = false;
                int b = 0;
                ForceCalculationType type = GetType(current);
                switch (type) {
                    case NEAREST -> {
                        nearest = getNearestCircular(x, y, hitColor);
                    }
                    case NEAREST_ROTATED -> {
                        nearest = getNearestCircular(x, y, hitBlack);
                        rotate = true;
                        degrees = invertBlueRotation ? -rotation : rotation;
                        b += 128;
                    }
                    case NEAREST_OUTER_ROTATED -> {
                        nearest = getNearestOuter(x, y, 30, hitBlack);
                        rotate = true;
                        degrees = rotation;
                        b += 128;
                    }
                    default -> nearest = Vec2.Zero();
                }

                Vec2 pos = new Vec2(x, y);
                Vec2 dir = nearest.sub(pos);
                if (rotate)
                    dir = dir.rotated(degrees);

                double scaled = MMath.clamp(dir.length() / maxEncodedLength, 0.0, 1.0);
                b += MMath.clamp((int) (scaled * 128), 0, 127);
                img.setRGB(x, y, dir.toRGB(b));
            }
            System.out.println("Row " + x + " Completed");
        }

        if (useBlur) {
            float otherWeight = 1.0f / (8f + selfWeight);
            float centerWeight = selfWeight / (8f + selfWeight);
            ;
            Kernel kernel = new Kernel(3, 3, new float[]{
                    otherWeight, otherWeight, otherWeight,
                    otherWeight, centerWeight, otherWeight,
                    otherWeight, otherWeight, otherWeight});
            BufferedImageOp op = new ConvolveOp(kernel, ConvolveOp.EDGE_NO_OP, new RenderingHints(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON));
            img = op.filter(img, null);


            long blurTime = System.currentTimeMillis();
            System.out.println("Blurred Image " + (blurTime - start) + " Millis.");
        }

        start = System.currentTimeMillis();


        long totalTime = System.currentTimeMillis();
        System.out.println("Generation finished in " + (totalTime - init) / 1000.0 + " Seconds.");

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

    private Vec2 getNearestCircular(int x, int y, ColorToBooleanFunc func) {
        return getNearestCircular(x, y, func, 1, Vec2.Infinity());
    }

    private Vec2 getNearestCircular(int x, int y, ColorToBooleanFunc func, int searchRange, Vec2 result) {
        // Check if error or finished
        if (original.getHeight() <= searchRange || original.getWidth() <= searchRange)
            throw new IllegalStateException("No pixel found that satisfies func");
        if (result.isFinite() && result.lengthTo(x, y) < searchRange + 1) {
            return result;
        }

        int lowerX = Math.max(x - searchRange, 0);
        int upperX = Math.min(x + searchRange, original.getWidth() - 1);
        int lowerY = Math.max(y - searchRange, 0);
        int upperY = Math.min(y + searchRange, original.getHeight() - 1);
        // search pixels horizontally
        Optional<Vec2> horizontalRes = findInRange(x, y, result, func,
                lowerX, upperX, lowerY, upperY, true);
        if (horizontalRes.isPresent())
            result = horizontalRes.get();

        Optional<Vec2> verticalRes = findInRange(x, y, result, func,
                lowerX, upperX, lowerY + 1, upperY - 1, false);
        if (verticalRes.isPresent())
            result = verticalRes.get();

        return getNearestCircular(x, y, func, searchRange + 1, result);
    }

    private Vec2 getNearestOuter(int x, int y, float fovHalf, ColorToBooleanFunc func) {
        Vec2 dir = (new Vec2(x, y)).sub(new Vec2(original.getWidth() / 2, original.getHeight() / 2));
        if (dir.length() < 0.0001)
            return getNearestCircular(x, y, func, 1, Vec2.Infinity());
        return getNearestOuter(x,y, fovHalf, func, 1, Vec2.Infinity());
    }

    private Vec2 getNearestOuter(int x, int y, float fovHalf, ColorToBooleanFunc func, int searchRange, Vec2 result) {
        if (original.getHeight() <= searchRange || original.getWidth() <= searchRange)
            throw new IllegalStateException("No pixel found that satisfies func");
        if (result.isFinite() && result.lengthTo(x, y) < searchRange + 1) {
            return result;
        }

        int lowerX = Math.max(x - searchRange, 0);
        int upperX = Math.min(x + searchRange, original.getWidth() - 1);
        int lowerY = Math.max(y - searchRange, 0);
        int upperY = Math.min(y + searchRange, original.getHeight() - 1);
        // search pixels horizontally
        Optional<Vec2> horizontalRes = findInOuterAngle(x, y, result, func,
                lowerX, upperX, lowerY, upperY, fovHalf, true);
        if (horizontalRes.isPresent())
            result = horizontalRes.get();

        Optional<Vec2> verticalRes = findInOuterAngle(x, y, result, func,
                lowerX, upperX, lowerY + 1, upperY - 1, fovHalf,false);
        if (verticalRes.isPresent())
            result = verticalRes.get();

        return getNearestOuter(x, y, fovHalf,func,searchRange + 1, result);
    }

    private Optional<Vec2> findInRange(int x, int y,
                                       Vec2 previousRes, ColorToBooleanFunc func,
                                       int lowerXIn, int upperXIn,
                                       int lowerYIn, int upperYIn,
                                       boolean horizontally) {
        int lowerX = Math.min(lowerXIn, upperXIn);
        int upperX = Math.max(lowerXIn, upperXIn);
        int lowerY = Math.min(lowerYIn, upperYIn);
        int upperY = Math.max(lowerYIn, upperYIn);

        Vec2 res = previousRes;
        for (int i = horizontally ? lowerX : lowerY;
             i <= (horizontally ? upperX : upperY);
             i++) {
            {
                // Check lower
                int lx = horizontally ? i : lowerX;
                int ly = horizontally ? lowerY : i;
                if (func.op(new Color(original.getRGB(lx, ly)))) {
                    Vec2 newRes = new Vec2(lx, ly);
                    if (newRes.lengthTo(x, y) < res.lengthTo(x, y))
                        res = newRes;
                }
            }
            {
                // Check upper
                int ux = horizontally ? i : upperX;
                int uy = horizontally ? upperY : i;
                if (func.op(new Color(original.getRGB(ux, uy)))) {
                    Vec2 newRes = new Vec2(ux, uy);
                    if (newRes.lengthTo(x, y) < res.lengthTo(x, y))
                        res = newRes;
                }
            }
        }
        return res.equals(previousRes) ? Optional.empty() : Optional.of(res);
    }

    private Optional<Vec2> findInOuterAngle(int x, int y,
                                            Vec2 previousRes, ColorToBooleanFunc func,
                                            int lowerXIn, int upperXIn,
                                            int lowerYIn, int upperYIn,
                                            float degrees,
                                            boolean horizontally) {
        int lowerX = Math.min(lowerXIn, upperXIn);
        int upperX = Math.max(lowerXIn, upperXIn);
        int lowerY = Math.min(lowerYIn, upperYIn);
        int upperY = Math.max(lowerYIn, upperYIn);
        Vec2 pos = new Vec2(x,y);
        Vec2 dir = pos.sub(new Vec2(original.getWidth()/2, original.getHeight()/2)).normalize();
        Vec2 res = previousRes;
        for (int i = horizontally ? lowerX : lowerY;
             i <= (horizontally ? upperX : upperY);
             i++) {
            {
                // Check lower
                int lx = horizontally ? i : lowerX;
                int ly = horizontally ? lowerY : i;
                Vec2 cDir = (new Vec2(lx,ly)).sub(pos);
                double angle = cDir.angleTo(dir);
                if (angle <= degrees && func.op(new Color(original.getRGB(lx, ly)))) {
                    Vec2 newRes = new Vec2(lx, ly);
                    if (newRes.lengthTo(x, y) < res.lengthTo(x, y))
                        res = newRes;
                }
            }
            {
                // Check upper
                int ux = horizontally ? i : upperX;
                int uy = horizontally ? upperY : i;
                Vec2 cDir = (new Vec2(ux,uy)).sub(pos);
                double angle = cDir.angleTo(dir);
                if (angle <= degrees && func.op(new Color(original.getRGB(ux, uy)))) {
                    Vec2 newRes = new Vec2(ux, uy);
                    if (newRes.lengthTo(x, y) < res.lengthTo(x, y))
                        res = newRes;
                }
            }
        }
        return res.equals(previousRes) ? Optional.empty() : Optional.of(res);
    }
}