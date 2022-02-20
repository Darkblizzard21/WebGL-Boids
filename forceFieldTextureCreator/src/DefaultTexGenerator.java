import util.Vec2;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

public class DefaultTexGenerator {
    private DefaultTexGenerator() {

    }

    public static void generateCircle(int size, File out){
        BufferedImage img = new BufferedImage(size,size, BufferedImage.TYPE_3BYTE_BGR);
        Vec2 center = new Vec2(size/2,size/2);
        for (int x = 0; x < size; x++) {
            for (int y = 0; y < size; y++) {
                img.setRGB(x,y,center.sub(new Vec2(x,y)).normalized().toColor(0.0f).getRGB());
            }
        }
        try {
            if (!out.exists() && !out.createNewFile())
                throw new IllegalStateException();
            ImageIO.write(img, "png", out);
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
    }
}
