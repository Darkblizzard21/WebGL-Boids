import java.io.File;

public class main {
    public static void main(String[] args) {
        String file = "gl-I";
        String inPath = ".\\input\\" + file + ".png";
        String outPath = ".\\mediaOut\\" + file + ".png";
        generated(inPath,outPath);
    }

    public static void generated(String in, String out){
        ForceFieldGen ffg = new ForceFieldGen(new File(in));
        ffg.invertBlueRotation();
        ffg.enableBlur();
        ffg.setBlurCenterWeight(8);
        ffg.gen();
        ffg.save(new File(out));
    }
}
