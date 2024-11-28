const none = {
  initial: {
    background: "transparent",
  },
  animate: {
    background: "transparent",
  },
};

const highlight = {
  initial: {
    background: `linear-gradient(to right, 
          #BFBFFF70 0%, 
          #BFBFFF70 0%, 
          transparent 0%, 
          transparent 100%
        )`,
  },
  animate: {
    background: `linear-gradient(to right, 
          #BFBFFF70 0%, 
          #BFBFFF70 100%, 
          transparent 100%, 
          transparent 100%
        )`,
    transition: {
      duration: 1,
      ease: "linear",
    },
  },
};

const gradation = {
  initial: {
    background: `linear-gradient(to right,
      #BFBFFF 0%,    
      #B0E2FF 50%,   
      #FFE4E1 100%   
    )`,
    backgroundSize: "300% 100%",
    backgroundPosition: "100% 0",
  },
  animate: {
    background: [
      `linear-gradient(to right,
        #BFBFFF 0%,
        #B0E2FF 50%,
        #FFE4E1 100%
      )`,
      `linear-gradient(to right,
        #FFE4E1 0%,
        #BFBFFF 50%,
        #B0E2FF 100%
      )`,
      `linear-gradient(to right,
        #B0E2FF 0%,
        #FFE4E1 50%,
        #BFBFFF 100%
      )`,
      `linear-gradient(to right,
        #BFBFFF 0%,
        #B0E2FF 50%,
        #FFE4E1 100%
      )`,
    ],
    transition: {
      duration: 3,
      ease: "linear",
      repeat: Infinity,
      times: [0, 0.33, 0.66, 1],
    },
  },
};

export const blockAnimation = {
  none,
  highlight,
  gradation,
};
